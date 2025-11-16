import os
import torch
import timm
import torch.nn as nn
from flask import Flask, request, jsonify
from PIL import Image
from torchvision import transforms
from dotenv import load_dotenv
import google.generativeai as genai
import requests
from io import BytesIO

# --- 1. INITIAL SETUP & CONFIGURATION ---

load_dotenv()

app = Flask(__name__)

# Configure Gemini API
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    print("✅ Gemini Flash model configured successfully.")

    # Test the model with a simple request to ensure it's working
    gemini_model.generate_content("test")
    print("✅ Gemini Flash model configured and tested successfully.")
except Exception as e:
    print(f"🔥 ERROR: Failed to configure Gemini. Check your API key. Error: {e}")
    gemini_model = None

# --- 2. SETUP THE "SEER" (EFFICIENTNET MODEL) ---

# This must match the training script exactly
LABEL_NAMES = [
    'Bark with Heavy Shading', 'Birds in Tree', 'Branches Extending Upward',
    'Branches Touching Ground', 'Cloud-Shaped Branches', 'Crooked Trunk',
    'Cut or Detached Branches', 'Dead Tree', 'Downward Drooping Branches',
    'Extra Detail on Leaves', 'Fantasy-Like Tree', 'Fruit on Tree',
    'Hallow or Scarred Trunk', 'Large Tree', 'Nest in Branches', 'Palm Tree',
    'Pine Tree', 'Pointy Leaves', 'Roots', 'Small Tree', 'Thick Tree',
    'Thin Tree', 'Tree Split Down Middle', 'Tree Without Branches',
    'Very Long Roots'
]
NUM_LABELS = len(LABEL_NAMES)
MODEL_SAVE_PATH = "models/best_htp_classifier.pth"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🧠 Using device: {device}")

# Load the model structure
seer_model = timm.create_model("efficientnet_b0", pretrained=False)
seer_model.classifier = nn.Linear(seer_model.classifier.in_features, NUM_LABELS)

# Load your saved weights
try:
    seer_model.load_state_dict(torch.load(MODEL_SAVE_PATH, map_location=device))
    seer_model.to(device)
    seer_model.eval()
    print(f"✅ 'Seer' (EfficientNet) model loaded from {MODEL_SAVE_PATH}.")
except FileNotFoundError:
    print(f"🔥 ERROR: Model weights not found at {MODEL_SAVE_PATH}. The API will not work.")
    seer_model = None

# Define the image transforms (must match validation transform)
IMAGE_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
val_transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD)
])

# --- 3. LOAD RAG KNOWLEDGE BASE FROM FILE ---
KNOWLEDGE_FILE = os.getenv('KNOWLEDGE_FILE', 'knowledge_base.txt')
RAG_CONTEXT = ""  # Will be populated from file

def load_knowledge_file(path):
    """Load knowledge base from external file."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = f.read()
        if data.strip():
            print(f"✅ Loaded RAG knowledge from file: {path} ({len(data)} chars)")
            return data
        else:
            print(f"ERROR: Knowledge file {path} is empty.")
            return ""
    except FileNotFoundError:
        print(f"ERROR: Knowledge file not found at {path}. Please create it.")
        return ""
    except Exception as e:
        print(f"ERROR reading knowledge file {path}: {e}")
        return ""

# Load knowledge base from file
RAG_CONTEXT = load_knowledge_file(KNOWLEDGE_FILE)
if not RAG_CONTEXT:
    print("⚠️ WARNING: No knowledge base loaded. RAG pipeline will not work properly.")


# --- 4. RAG PIPELINE: EMBEDDING & RETRIEVAL ---
VECTOR_STORE = []  # Will store {'text': str, 'embedding': list}

def embed_text(text, model="models/text-embedding-004"):
    """Convert text into embedding vector using Gemini."""
    try:
        result = genai.embed_content(
            model=model,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Embed error (text): {e}")
        return None

def embed_query(text, model="models/text-embedding-004"):
    """Convert query text into embedding vector."""
    try:
        result = genai.embed_content(
            model=model,
            content=text,
            task_type="retrieval_query"
        )
        return result['embedding']
    except Exception as e:
        print(f"Embed error (query): {e}")
        return None

def build_vector_store_from_rag(rag_text):
    """Split RAG text into chunks and create embeddings."""
    global VECTOR_STORE
    VECTOR_STORE = []
    
    if not rag_text:
        print("No RAG text provided to build vector store.")
        return
    
    # Split into chunks by bullet points and sub-bullets
    knowledge_chunks = []
    for item in rag_text.split('\n- '):
        item = item.strip()
        if not item:
            continue
        
        if '•' in item:
            # Parse main feature and interpretations
            parts = item.split(' • ')
            title = parts[0].strip()
            for text in parts[1:]:
                if text.strip():
                    knowledge_chunks.append(f"{title}: {text.strip()}")
        else:
            knowledge_chunks.append(item)
    
    print(f"Building vector store with {len(knowledge_chunks)} chunks...")
    
    for chunk in knowledge_chunks:
        emb = embed_text(chunk)
        if emb:
            VECTOR_STORE.append({'text': chunk, 'embedding': emb})
    
    print(f"✅ Vector store built with {len(VECTOR_STORE)} embeddings.")

def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    try:
        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(y * y for y in b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot_product / (norm_a * norm_b)
    except Exception:
        return 0.0

def retrieve_relevant_context(detected_features, top_k=5):
    """Retrieve top_k most relevant knowledge chunks for detected features."""
    if not VECTOR_STORE:
        print("Vector store empty; returning full RAG_CONTEXT as fallback.")
        return RAG_CONTEXT
    
    # Create query from detected features
    query_text = ", ".join(detected_features) if isinstance(detected_features, list) else str(detected_features)
    query_embedding = embed_query(query_text)
    
    if not query_embedding:
        print("Failed to compute query embedding; returning full RAG_CONTEXT as fallback.")
        return RAG_CONTEXT
    
    # Compute similarity scores
    scores = []
    for item in VECTOR_STORE:
        score = cosine_similarity(query_embedding, item['embedding'])
        scores.append((score, item['text']))
    
    # Sort by score and get top_k
    scores.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [text for score, text in scores[:top_k]]
    
    return "\n- ".join(top_chunks)

def generate_gemini_report_RAG(detected_features, retrieved_context):
    """Generate psychological interpretation using only retrieved context."""
    if not gemini_model:
        return "LLM not configured."
    
    system_prompt = (
        "You are an expert clinical psychologist specializing in the HTP (House-Tree-Person) "
        "projective test. Your task is to interpret observed features from a tree drawing using "
        "ONLY the provided relevant knowledge base. Be clinical, objective, and concise. "
        "Do not add preamble or conclusions."
    )
    
    user_prompt = (
        f"--- RELEVANT KNOWLEDGE ---\n{retrieved_context}\n--- END KNOWLEDGE ---\n\n"
        f"A vision model detected the following visual features: {detected_features}\n\n"
        f"Psychological Interpretation:"
    )
    
    full_prompt = f"{system_prompt}\n\n{user_prompt}"
    
    try:
        response = gemini_model.generate_content(full_prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini generation error: {e}")
        return f"LLM generation failed: {e}"

# Build vector store at startup if Gemini is configured
if gemini_model is not None:
    try:
        build_vector_store_from_rag(RAG_CONTEXT)
    except Exception as e:
        print(f"Failed to build vector store at startup: {e}")


# --- 5. FLASK API ENDPOINT ---

@app.route('/ml/analyze-drawing', methods=['POST'])
def analyze_drawing_endpoint():
    if not seer_model:
        return jsonify({"error": "Seer model is not loaded. Cannot process request."}), 500
    if not gemini_model:
        return jsonify({"error": "Gemini model is not configured. Cannot process request."}), 500

    data = request.get_json()
    if not data or 'imageURL' not in data:
        return jsonify({"error": "Missing 'imageURL' in request body"}), 400

    image_url = data['imageURL']

    try:
        # Load image from URL
        response = requests.get(image_url)
        response.raise_for_status() # Raise an exception for bad status codes
        image = Image.open(BytesIO(response.content)).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Failed to load image from URL: {e}"}), 400

    # --- STAGE 1: "SEER" PREDICTION ---
    input_tensor = val_transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = seer_model(input_tensor)
        probs = torch.sigmoid(outputs)
        preds = (probs > 0.5).cpu().numpy()[0]

    predicted_labels = [LABEL_NAMES[i] for i, pred in enumerate(preds) if pred == 1]

    # --- STAGE 2: RAG RETRIEVAL ---
    is_flagged = len(predicted_labels) > 0
    final_analysis = "The 'Seer' model detected no specific features."

    if is_flagged:
        try:
            # Retrieve relevant context using RAG pipeline
            print(f"Retrieving relevant context for: {predicted_labels}")
            retrieved_context = retrieve_relevant_context(predicted_labels, top_k=5)
            
            # Generate interpretation using only retrieved context
            final_analysis = generate_gemini_report_RAG(predicted_labels, retrieved_context)
        except Exception as e:
            print(f"🔥 RAG pipeline failed: {e}")
            final_analysis = f"LLM analysis failed. Raw features detected: {predicted_labels}"


    # --- 5. CONSTRUCT THE JSON RESPONSE ---
    # This structure matches the one your main backend expects.
    response_payload = {
        "flaggedForReview": is_flagged,
        "flagConfidence": float(probs.max()) if is_flagged else 0.0,
        "psychIndicators": [
            # We combine everything into one text block for simplicity,
            # but you could parse Gemini's output for more structure.
            {
                "indicator": "(Comprehensive Analysis)",
                "evidence": predicted_labels,
                "interpretation": final_analysis,
                "confidence": 0.85 # Mock confidence for the LLM part
            }
        ],
        "modelVersion": "seer-efficientnet-b0_rag-retrieval_gemini-flash-v1.0"
    }

    return jsonify(response_payload)


if __name__ == '__main__':
    # Run the Flask app on port 5002 to avoid conflicts with other services
    app.run(debug=True, port=5002)