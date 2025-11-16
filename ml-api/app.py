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

# --- 3. DEFINE THE RAG KNOWLEDGE BASE ---
RAG_CONTEXT = """
- ANIMAL PEEKING FROM HOLE IN TREE • Feeling that segment of personality is pathoformically free from control and presumably has destructive potentialities; obsessive guilt. • Children often identify with an animal, thus depicting regressive yearnings for withdrawn, warm, protecting uterine existence.
- APPLE TREE • Frequently drawn by dependent children. • Pregnant women or those desiring children often draw apple trees.
- APPLES, FALLING OR FALLEN • Indicates child's feeling of rejection.
- BARK Depicted by vine-like vertical lines well separated • Suggests schizoid characteristics.
- BARK Easily drawn • Well-balanced interaction.
- BARK Inconsistently or heavily drawn • Anxiety.
- BARK Meticulously drawn • Compulsiveness with overconcern about relationships with environment.
- BRANCHES • Degree of flexibility of branches, number, size, and extent of interrelationship indicate view of adaptability and availability for deriving satisfactions in environment.
- BRANCHES Absolute symmetry of • Implies feelings of ambivalence; inability to grant dominance to emotional or intellectual course of action.
- BRANCHES Broken, bent, or dead • Significant psychic or physical trauma. • Castration feelings: psychosexual or psychosocial.
- BRANCHES Indicated by shaded implication • When easily and quickly drawn, indicative of tactful but possibly superficial interaction.
- BRANCHES Indicated by unshaded implication • Oppositional tendencies.
- BRANCHES Intended to be two dimensional but not "closed" at distal end • Little control over expression of drives.
- BRANCHES New growth protruding from barren trunk • Reversal of crippling belief that seeking satisfaction from environment was fruitless. • Probably sexual rejuvenation, if history of impotence exists.
- BRANCHES One-dimensional, not forming a system and inadequately joined to a one-dimensional trunk • Organicity. • Impotence feelings, futility, lack of ego strength with poor integration of satisfaction-seeking resources.
- BRANCHES One- or two-dimensional, turning inward • Strong intratensive ruminative tendencies.
- BRANCHES Overemphasis to left • Personality imbalance due to tendency to seek strenuously for immediate, frank emotional satisfaction: extratensivity.
- BRANCHES Overemphasis to right • Personality imbalance produced by strong tendency to avoid or delay emotional satisfaction, or seek satisfaction through intellectual effort.
- BRANCHES Phallic-like • Sexual preoccupations. • Strivings for virility.
- BRANCHES Spike-like • Subconscious castration fear. • Masochistic tendencies if point is at trunk end of branch.
- BRANCHES Two-dimensional, drawn like clubs or fingers with little organization • Strong hostility and aggression. • If not overtly aggressive, hostility is repressed with considerable inner tension created.
- BRANCHES Two-dimensional, partially drawn with relatively refined branch system and foliage by implication • Implies well-developed ability to deal successfully with people, as in social work.
- BRANCHES "Wrapped" at ends in cloud-like balls • Inhibitions prevent outward discharge of aggression.
- BRANCH STRUCTURE Abruptly flattened at top • Attempt to reject or deny painful fantasy life.
- BRANCH STRUCTURE Overly large in relation to trunk • Feeling of basic inadequacy with concomitant overstriving to secure satisfaction from environment.
- BRANCH STRUCTURE Tall and narrow • Tendency to fear seeking satisfaction from and in environment.
- DETAILS, ESSENTIAL • Trunk and one branch may be regarded as normal when the drawing is identified as a stump.
- GROUND, TRANSPARENCIY OF, ROOTS SHOWN BELOW SURFACE • Pathoformic reality flaw. • Suggestive of organicity.
- GROUNDLINE, ARC-LIKE HILL • Tree upon crest of arc-like hill frequently represents oral-erotic fixation with need for maternal protection. • When Tree is small, maternal dependence with feelings of isolation and helplessness indicated.
- LEAVES Fallen or falling • Feels losing ability to hide thoughts and feelings. • Feels losing ability for more controlled and delicate adjustments in and to environment.
- LEAVES Many presented in detail • Obsessive-compulsive characteristics.
- LEAVES Two-dimensional, too large for branches • Wishes to mask basic feelings of inadequacy with cloak of superficial adjustment. • Overcompensatory attempt to take flight into reality.
- PERSPECTIVE Below subject • Defeatist attitude. • Tendency toward concretivity. • Rejection of person represented by Tree.
- PERSPECTIVE Partly up a hill • Feelings of striving. • Need for shelter and security.
- PERSPECTIVE Top of hill, by itself • Sometimes indicates feeling of superiority. • Sometimes represents feeling of isolation, concomitant with struggle for autonomy.
- ROOTS Dead • Intrapersonal imbalance or dissolution with suggested pathoformic loss of drive and grasp of reality. • Obsessive-depressive feelings associated with early life.
- ROOTS Entering ground, overemphasis upon • Great need to maintain grasp of reality. • Insecurity.
- ROOTS Talon-like, not penetrating ground surface • Poor reality contact. • Paranoid aggressive attitudes suggested.
- ROOTS Thin-lined, making tenuous contact with ground • Poor reality contact.
- ROOTS Transparent from underground • Impairment of reality awareness. • Organicity, particularly in children.
- SCARS • Psychic and/or physical experience regarded traumatically.
- SHADOW • Anxiety-binding factor within conscious level of personality. • Unsatisfying relationship of psychological past with psychological present.
- SUN Large • Acute awareness of relationship to authority figure.
- SUN Location of • Relationship of Tree to source of warmth and/or power. • Frequently symbolizes relationship felt between the subject and dominant environmental figure.
- SUN Setting • Feelings of depression.
- TREE Drawn as two one-dimensional trees • Strongly suggests pathologic dichotomy of affect and intellect. • Organicity suspected.
- TREE "Keyhole" • Strong hostile impulses. • Somewhat rigid personality, with much potential for explosive behavior.
- TREE Large but contained within page • Acutely aware of self in environment. • Likely to attempt to secure satisfaction in activity rather than fantasy.
- TREE Leaning to left • Imbalance of personality because of desire to secure frank, immediate, emotional satisfaction in behaving impulsively. • Fixation on past and/or fear of future.
- TREE Leaning to right • Imbalance of personality due to fear of frank, emotional expression with concomitant overemphasis upon intellectual satisfactions. • Fixation on future and/or desire to forget unhappy past.
- TREE "Phallic" • Common for children under 8 years. • Suggests psychosexual immaturity and/or phallic preoccupations.
- TREE Small • Feels inferior and inadequate. • Desire to withdraw.
- TRUNK Broad at base with rapid diminishing of breadth • Early environment lacking in warmth and healthful stimulation with resultant cramping effect on personality maturation.
- TRUNK Broken and tip of tree touching ground • Symbolically expresses feeling of having been overwhelmed by internal or external forces beyond control.
- TRUNK Dead • Feels crippling loss of ego control.
- TRUNK Faint lines • Feeling of lack of ego strength, indecision and inadequacy, accompanied by anxiety.
- TRUNK Large, with small branch structure • Precarious personality balance because of frustration engendered by inability to satisfy strong basic needs. • Emotional immaturity or egocentricity.
- TRUNK Leaning to left and then to right • Tendency at early age to regress and behave impulsively and at later age to overcompensate by strong controls and fixation on future.
- TRUNK Narrower at base than at higher points • Striving beyond the subject's strength with concomitant implications of possible collapse of ego control.
- TRUNK One-dimensional, with one-dimensional branches that do not form a system • Organic state suspected. • Feelings of impotence, futility, and lack of ego strength.
- TRUNK Overly large • Feelings of environmental constriction with tendency to react aggressively in reality or fantasy.
- TRUNK Reinforcement of peripheral lines • Need to maintain control or personality intactness. • Employs compensatory defenses to cloak and combat fear of personality diffusion.
- TRUNK Tiny • Feelings of basic inadequacy and ineptness.
- TRUNK Truncated with tiny branches growing from stump • Core of self felt to be damaged. • Stunted growth with renewed efforts or hope for regrowth.
- TRGUNK Two-dimensional, with one-dimensional branches • Good early development but later interference by serious traumatic events.
- TRUNK Very slender, with large branch structures • Precarious personality balance because of over-striving for satisfaction.
- WIND Blowing from ground level to tree-top • Compulsive need to escape reality and enter fantasy.
- WIND Blowing from subject • Desire to deny feelings of pressure. • Desire to aggress against sources of frustration.
- WIND Blowing from top to bottom • Compulsive need to escape fantasy and return to reality.
- WIND Blowing from Tree toward subject • Narcissistic tendency; for example, wishes or feels control over person the Tree represents.
- WIND Blowing in all directions simultaneously • Suggestive of acute reality testing failure.
"""
print("RAG context defined.")

# --- 4. FLASK API ENDPOINT ---

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

    # --- STAGE 2: "INTERPRETER" (GEMINI) GENERATION ---
    is_flagged = len(predicted_labels) > 0
    final_analysis = "The 'Seer' model detected no specific features."

    if is_flagged:
        try:
            # Create the prompt for Gemini
            prompt = (
                f"You are an expert clinical psychologist specializing in the HTP projective test. "
                f"Your task is to interpret a list of observed features from a tree drawing based on a provided knowledge base. "
                f"Semantically match the detected features to the *closest* concepts in the knowledge base and provide a concise, objective interpretation. "
                f"Do not add any preamble or conclusion. Just provide the direct interpretation.\n\n"
                f"--- KNOWLEDGE BASE ---\n{RAG_CONTEXT}\n--- END KNOWLEDGE BASE ---\n\n"
                f"A vision model detected the following raw visual features: {predicted_labels}\n\n"
                f"Psychological Interpretation:"
            )

            response = gemini_model.generate_content(prompt)
            final_analysis = response.text.strip()
        except Exception as e:
            print(f"🔥 Gemini API call failed: {e}")
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
        "modelVersion": "seer-efficientnet-b0_interpreter-gemini-pro-v1.0"
    }

    return jsonify(response_payload)


if __name__ == '__main__':
    # Run the Flask app on port 5002 to avoid conflicts with other services
    app.run(debug=True, port=5002)