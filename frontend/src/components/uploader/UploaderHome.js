import React from 'react';

function UploaderHome({ setView }) {
    return (
        <div className="uploader-home">
            <div className="welcome-header">
                <div className="uploader-avatar">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                    </svg>
                </div>
                <h1 className="welcome-title">Welcome, Uploader</h1>
                <p className="welcome-subtitle">Upload and manage children's drawings for psychological assessment</p>
            </div>

            <div className="uploader-actions-grid">
                <div className="uploader-action-card" onClick={() => setView('upload')}>
                    <div className="card-icon upload-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" fill="currentColor"/>
                        </svg>
                    </div>
                    <h3>Upload New Drawing</h3>
                    <p>Submit a new child's drawing for AI-assisted analysis</p>
                    <div className="card-action">Upload Drawing →</div>
                </div>

                <div className="uploader-action-card" onClick={() => setView('status')}>
                    <div className="card-icon status-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                        </svg>
                    </div>
                    <h3>Check Submission Status</h3>
                    <p>View all submissions and their evaluation status</p>
                    <div className="card-action">View Status →</div>
                </div>
            </div>
        </div>
    );
}

export default UploaderHome;