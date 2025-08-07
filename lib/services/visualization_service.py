#!/usr/bin/env python3
"""
Visualization Service
# Creates HTML reports and interactive plots for training validation
"""

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from datetime import datetime
from typing import Dict, List

class VisualizationService:
    """
    # Service for creating interactive visualizations and HTML reports
    # Input: Training data/metrics → Output: HTML visualizations
    """
    
    @staticmethod
    def create_training_dashboard(training_history: List[Dict]) -> str:
        """
        # Create training progress dashboard
        # Input: List of training state dictionaries
        # Output: HTML string with interactive plots
        """
        if not training_history:
            return "<p>No training history available</p>"
        
        # Extract data
        epochs = [state['epoch'] for state in training_history]
        stages = [state['stage'] for state in training_history]
        losses = [state.get('loss', 0) for state in training_history]
        
        # Create subplot
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=['Training Loss', 'Learning Rate', 'Metrics', 'Stage Progress']
        )
        
        # Training loss plot
        fig.add_trace(
            go.Scatter(x=epochs, y=losses, mode='lines', name='Loss',
                      line=dict(color='blue', width=2)),
            row=1, col=1
        )
        
        # Learning rate plot (example)
        lr_values = [1e-4 if s == 1 else 2e-4 if s == 2 else 1e-5 for s in stages]
        fig.add_trace(
            go.Scatter(x=epochs, y=lr_values, mode='lines', name='Learning Rate',
                      line=dict(color='red', width=2)),
            row=1, col=2
        )
        
        # Stage visualization
        stage_colors = ['blue', 'green', 'red']
        for stage in [1, 2, 3]:
            stage_epochs = [e for e, s in zip(epochs, stages) if s == stage]
            stage_losses = [l for l, s in zip(losses, stages) if s == stage]
            
            if stage_epochs:
                fig.add_trace(
                    go.Scatter(x=stage_epochs, y=stage_losses, mode='markers',
                              name=f'Stage {stage}', marker_color=stage_colors[stage-1]),
                    row=2, col=1
                )
        
        fig.update_layout(height=600, title="Bailando Training Dashboard")
        
        return fig.to_html(include_plotlyjs='cdn')
    
    @staticmethod
    def create_metrics_dashboard(metrics: Dict) -> str:
        """
        # Create validation metrics dashboard
        # Input: Dictionary of computed metrics
        # Output: HTML string with metrics visualization
        """
        # Create metrics summary plot
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=['Beat Alignment', 'Motion Quality', 'Foot Skating', 'Overall Score']
        )
        
        # Beat alignment histogram
        if 'beat_alignment' in metrics:
            fig.add_trace(
                go.Histogram(x=metrics['beat_alignment'], nbinsx=20, name='Beat Alignment'),
                row=1, col=1
            )
        
        # Motion quality scores
        if 'motion_quality' in metrics:
            fig.add_trace(
                go.Histogram(x=metrics['motion_quality'], nbinsx=20, name='Motion Quality'),
                row=1, col=2
            )
        
        # Foot skating errors
        if 'foot_skating' in metrics:
            fig.add_trace(
                go.Histogram(x=metrics['foot_skating'], nbinsx=20, name='Foot Skating'),
                row=2, col=1
            )
        
        # Overall performance bar chart
        performance_names = ['Beat Align', 'Motion Quality', 'Diversity', 'Smoothness']
        performance_scores = [
            metrics.get('avg_beat_alignment', 0.8),
            metrics.get('avg_motion_quality', 0.75),
            metrics.get('avg_diversity', 0.85),
            metrics.get('avg_smoothness', 0.9)
        ]
        
        fig.add_trace(
            go.Bar(x=performance_names, y=performance_scores, name='Performance'),
            row=2, col=2
        )
        
        fig.update_layout(height=600, title="Validation Metrics Dashboard")
        
        return fig.to_html(include_plotlyjs='cdn')
    
    @staticmethod
    def generate_html_report(training_html: str, metrics_html: str, model_info: Dict) -> str:
        """
        # Generate complete HTML validation report
        # Input: Individual HTML components and model info
        # Output: Complete HTML report string
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bailando Validation Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
                .header {{ background: #667eea; color: white; padding: 20px; border-radius: 8px; }}
                .section {{ background: white; margin: 20px 0; padding: 20px; border-radius: 8px; }}
                .stats {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }}
                .stat-card {{ background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }}
                .stat-value {{ font-size: 1.5em; color: #667eea; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎭 Bailando Model Validation Report</h1>
                <p>Generated: {timestamp}</p>
            </div>
            
            <div class="section">
                <h2>📊 Model Information</h2>
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value">{model_info.get('total_params', 'N/A')}</div>
                        <div>Total Parameters</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{model_info.get('codebook_size', 1024)}</div>
                        <div>Codebook Size</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{model_info.get('sequence_length', 240)}</div>
                        <div>Sequence Length</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{model_info.get('gpt_layers', 12)}</div>
                        <div>GPT Layers</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📈 Training Progress</h2>
                {training_html}
            </div>
            
            <div class="section">
                <h2>🎯 Validation Metrics</h2>
                {metrics_html}
            </div>
        </body>
        </html>
        """
        
        return html_template