#!/usr/bin/env python3
"""
Bailando Checkpoint Analyzer Script
Analyzes checkpoints and generates comprehensive conclusions
"""

import os
import sys
import json
import torch
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import argparse

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.services.config_service import ConfigService
from lib.models.bailando import BailandoModel
from lib.analysis.train_analyzer import TrainingAnalyzer

class ModelAnalyzer:
    """Basic model analyzer since the full one doesn't exist"""
    
    def analyze_architecture(self, config: dict) -> dict:
        """Analyze model architecture from config"""
        model_config = config.get('model', {})
        
        # Calculate parameters
        motion_dim = model_config.get('motion_dim', 72)
        latent_dim = model_config.get('latent_dim', 256)
        codebook_size = model_config.get('codebook_size', 1024)
        gpt_layers = model_config.get('gpt_layers', 12)
        embed_dim = model_config.get('embed_dim', 512)
        
        # VQ-VAE parameters
        encoder_params = motion_dim * 512 + 512 * 256 + 256 * latent_dim
        decoder_params = latent_dim * 256 + 256 * 512 + 512 * motion_dim
        vq_params = codebook_size * latent_dim
        vq_vae_total = encoder_params + decoder_params + vq_params
        
        # GPT parameters
        attention_params = gpt_layers * (embed_dim * embed_dim * 4)
        ffn_params = gpt_layers * (embed_dim * embed_dim * 4 * 2)
        embedding_params = codebook_size * embed_dim + 1024 * embed_dim
        gpt_total = attention_params + ffn_params + embedding_params
        
        # Critic parameters
        critic_params = embed_dim * 256 + 256 * 1
        
        total_params = vq_vae_total + gpt_total + critic_params
        
        # Hardware suitability
        cpu_suitable = total_params < 20e6  # 20M parameter threshold for CPU
        
        return {
            "total_parameters": int(total_params),
            "vq_vae_parameters": int(vq_vae_total),
            "gpt_parameters": int(gpt_total),
            "critic_parameters": int(critic_params),
            "cpu_training_suitable": cpu_suitable,
            "hardware_suitability": {
                "cpu_training_suitable": cpu_suitable,
                "current_device": config.get('device', 'unknown'),
                "estimated_memory_gb": total_params * 4 / 1e9 * 4
            },
            "optimization_potential": {
                "optimization_score": 0.7 if not cpu_suitable else 0.3
            }
        }
    
    def compare_with_paper(self, config: dict) -> dict:
        """Compare current config with paper specifications"""
        model_config = config.get('model', {})
        training_config = config.get('training', {})
        
        paper_config = {
            "latent_dim": 256,
            "codebook_size": 1024,
            "gpt_layers": 12,
            "embed_dim": 512,
            "learning_rate": 3e-5,
            "batch_size": 16
        }
        
        differences = {}
        for key, paper_value in paper_config.items():
            if key in ['learning_rate', 'batch_size']:
                current_value = training_config.get(key, None)
            else:
                current_value = model_config.get(key, None)
            
            if current_value != paper_value:
                differences[key] = {
                    "paper": paper_value,
                    "current": current_value,
                    "ratio": current_value / paper_value if paper_value != 0 else float('inf')
                }
        
        return {
            "differences_from_paper": differences,
            "paper_alignment_score": 1 - (len(differences) / len(paper_config))
        }

class RecommendationEngine:
    """Basic recommendation engine"""
    
    def generate_recommendations(self, analysis_results: Dict) -> Dict:
        """Generate recommendations based on analysis"""
        performance = analysis_results.get('performance_metrics', {})
        
        immediate_actions = []
        optimization_opportunities = []
        
        # Check for critical issues
        if performance.get('performance_status') == 'critical_unstable':
            immediate_actions.append({
                "priority": "critical",
                "action": "stop_training_immediately",
                "description": "Loss explosion detected - halt training",
                "implementation": "Kill process and switch to stable config"
            })
        
        # Architecture optimization
        architecture = analysis_results.get('model_architecture', {})
        if not architecture.get('cpu_training_suitable', True):
            optimization_opportunities.append({
                "type": "model_compression",
                "description": "Model too large for CPU training",
                "expected_improvement": "Enable stable training on current hardware"
            })
        
        return {
            "immediate_actions": immediate_actions,
            "optimization_opportunities": optimization_opportunities,
            "configuration_changes": {
                "recommended_lr": 1e-5 if performance.get('performance_status') == 'critical_unstable' else None,
                "recommended_batch_size": 4 if not architecture.get('cpu_training_suitable', True) else None
            }
        }

class CheckpointAnalyzer:
    """Main checkpoint analysis orchestrator"""
    
    def __init__(self, checkpoint_path: str, config_path: str = None):
        self.checkpoint_path = Path(checkpoint_path)
        self.config_path = config_path or "config/bailando_config.yaml"
        self.training_analyzer = TrainingAnalyzer()
        self.model_analyzer = ModelAnalyzer()
        self.recommendation_engine = RecommendationEngine()
        
    def load_checkpoint_data(self) -> Dict:
        """Load checkpoint and extract metadata"""
        try:
            checkpoint = torch.load(self.checkpoint_path, map_location='cpu')
            config = ConfigService.load_config(self.config_path)
            
            return {
                'checkpoint': checkpoint,
                'config': config,
                'checkpoint_exists': True,
                'load_error': None
            }
        except Exception as e:
            return {
                'checkpoint': None,
                'config': None,
                'checkpoint_exists': False,
                'load_error': str(e)
            }
    
    def extract_checkpoint_metadata(self, checkpoint: Dict) -> Dict:
        """Extract basic checkpoint information"""
        return {
            "path": str(self.checkpoint_path),
            "epoch": checkpoint.get('epoch', 0),
            "stage": checkpoint.get('stage', 1), 
            "loss": checkpoint.get('loss', 0),
            "timestamp": checkpoint.get('timestamp', 'unknown'),
            "file_size_mb": round(self.checkpoint_path.stat().st_size / (1024*1024), 2),
            "contains_optimizer": 'optimizer_state_dict' in checkpoint,
            "contains_config": 'config' in checkpoint
        }
    
    def calculate_performance_metrics(self, checkpoint: Dict, training_data: Dict) -> Dict:
        """Calculate key performance indicators"""
        current_loss = checkpoint.get('loss', 0)
        progression = training_data.get('loss_progression', {})
        
        # Performance classification
        if current_loss > 500:
            performance_status = "critical_unstable"
            health_score = 0.1
        elif current_loss > 100:
            performance_status = "unstable"
            health_score = 0.4
        elif current_loss > 50:
            performance_status = "moderate"
            health_score = 0.7
        else:
            performance_status = "stable"
            health_score = 0.9
        
        # Training efficiency
        total_epochs = training_data.get('total_epochs', 1)
        initial_loss = progression.get('statistics', {}).get('initial_loss', current_loss)
        improvement = initial_loss - current_loss
        efficiency = max(0, improvement / total_epochs) if total_epochs > 0 else 0
        
        return {
            "current_loss": current_loss,
            "performance_status": performance_status,
            "health_score": health_score,
            "training_efficiency": round(efficiency, 4),
            "total_improvement": round(improvement, 4),
            "epochs_trained": total_epochs,
            "convergence_indicator": progression.get('trend', 'unknown')
        }
    
    def assess_next_actions(self, analysis_results: Dict) -> Dict:
        """Determine immediate next actions"""
        performance = analysis_results.get('performance_metrics', {})
        
        next_actions = {
            "immediate_priority": "unknown",
            "can_continue_training": False,
            "recommended_action": "analyze_further",
            "time_estimate": "unknown"
        }
        
        # Determine priority based on current state
        if performance.get('performance_status') == 'critical_unstable':
            next_actions.update({
                "immediate_priority": "critical_fix_required",
                "can_continue_training": False,
                "recommended_action": "apply_stable_configuration",
                "time_estimate": "1-2 hours"
            })
        elif performance.get('performance_status') == 'stable':
            stage = analysis_results.get('checkpoint_metadata', {}).get('stage', 1)
            if stage == 1:
                next_actions.update({
                    "immediate_priority": "continue_stage_1",
                    "can_continue_training": True,
                    "recommended_action": "continue_vq_vae_training",
                    "time_estimate": "2-4 hours"
                })
        
        return next_actions
    
    def generate_conclusion(self, logs_dir: str = "outputs/logs") -> Dict:
        """Generate comprehensive conclusion for checkpoint"""
        
        # Load checkpoint data
        checkpoint_data = self.load_checkpoint_data()
        
        if not checkpoint_data['checkpoint_exists']:
            return {
                "error": f"Failed to load checkpoint: {checkpoint_data['load_error']}",
                "timestamp": datetime.now().isoformat(),
                "status": "failed"
            }
        
        checkpoint = checkpoint_data['checkpoint']
        config = checkpoint_data['config']
        
        # Perform analysis using specialized analyzers
        analysis_results = {
            "checkpoint_metadata": self.extract_checkpoint_metadata(checkpoint),
            "training_progression": self.training_analyzer.analyze_progression(logs_dir),
            "model_architecture": self.model_analyzer.analyze_architecture(config),
            "configuration_analysis": self.model_analyzer.compare_with_paper(config)
        }
        
        # Calculate performance metrics
        analysis_results["performance_metrics"] = self.calculate_performance_metrics(
            checkpoint, analysis_results["training_progression"]
        )
        
        # Generate recommendations
        recommendations = self.recommendation_engine.generate_recommendations(analysis_results)
        
        # Assess next actions
        next_actions = self.assess_next_actions(analysis_results)
        
        # Create final conclusion
        conclusion = {
            "analysis_metadata": {
                "generated_at": datetime.now().isoformat(),
                "analyzer_version": "1.0.0",
                "checkpoint_analyzed": str(self.checkpoint_path),
                "config_used": self.config_path
            },
            
            "executive_summary": {
                "overall_status": analysis_results["performance_metrics"]["performance_status"],
                "health_score": analysis_results["performance_metrics"]["health_score"],
                "training_stage": analysis_results["checkpoint_metadata"]["stage"],
                "current_epoch": analysis_results["checkpoint_metadata"]["epoch"],
                "main_issue": self._identify_main_issue(analysis_results),
                "confidence_level": self._calculate_confidence(analysis_results)
            },
            
            "detailed_analysis": analysis_results,
            "recommendations": recommendations,
            "next_actions": next_actions,
            
            "actionable_insights": {
                "critical_issues": recommendations.get("immediate_actions", []),
                "optimization_opportunities": recommendations.get("optimization_opportunities", []),
                "success_probability": self._estimate_success_probability(analysis_results),
                "estimated_completion_time": self._estimate_completion_time(analysis_results)
            }
        }
        
        return conclusion
    
    def _identify_main_issue(self, analysis: Dict) -> str:
        """Identify the primary issue requiring attention"""
        performance = analysis.get('performance_metrics', {})
        
        if performance.get('performance_status') == 'critical_unstable':
            return "gradient_explosion_detected"
        elif performance.get('performance_status') == 'unstable':
            return "training_instability"
        elif analysis.get('model_architecture', {}).get('cpu_training_suitable') is False:
            return "model_too_complex_for_hardware"
        else:
            return "training_progressing_normally"
    
    def _calculate_confidence(self, analysis: Dict) -> float:
        """Calculate confidence in analysis results"""
        factors = []
        
        # Data availability
        if analysis.get('training_progression', {}).get('total_epochs', 0) > 10:
            factors.append(0.3)
        else:
            factors.append(0.1)
        
        # Architecture analysis success
        if 'error' not in analysis.get('model_architecture', {}):
            factors.append(0.3)
        else:
            factors.append(0.1)
        
        # Clear trend identification
        trend = analysis.get('training_progression', {}).get('loss_progression', {}).get('trend')
        if trend in ['converging', 'stable_oscillating']:
            factors.append(0.4)
        elif trend in ['explosive_divergence']:
            factors.append(0.4)  # High confidence in identifying problems
        else:
            factors.append(0.2)
        
        return round(sum(factors), 2)
    
    def _estimate_success_probability(self, analysis: Dict) -> float:
        """Estimate probability of successful training completion"""
        health_score = analysis.get('performance_metrics', {}).get('health_score', 0.5)
        architecture_suitable = analysis.get('model_architecture', {}).get('cpu_training_suitable', True)
        
        base_probability = health_score
        
        if not architecture_suitable:
            base_probability *= 0.3  # Reduce probability for unsuitable architecture
        
        return round(min(0.95, max(0.05, base_probability)), 2)
    
    def _estimate_completion_time(self, analysis: Dict) -> str:
        """Estimate time to complete training"""
        performance_status = analysis.get('performance_metrics', {}).get('performance_status', 'unknown')
        current_stage = analysis.get('checkpoint_metadata', {}).get('stage', 1)
        
        if performance_status == 'critical_unstable':
            return "requires_optimization_first"
        elif performance_status == 'stable':
            if current_stage == 1:
                return "2-6_hours_stage_1_completion"
            else:
                return "depends_on_optimization_success"
        else:
            return "depends_on_optimization_success"

def main():
    """Main execution function with proper error handling"""
    parser = argparse.ArgumentParser(description="Analyze Bailando checkpoint and generate conclusions")
    parser.add_argument('--checkpoint', type=str, required=True, help='Path to checkpoint file')
    parser.add_argument('--config', type=str, default='config/bailando_config.yaml', help='Config file path')
    parser.add_argument('--logs', type=str, default='outputs/logs', help='Training logs directory')
    parser.add_argument('--output', type=str, default='outputs/conclusions', help='Output directory')
    
    args = parser.parse_args()
    
    try:
        # Create analyzer and generate conclusion
        analyzer = CheckpointAnalyzer(args.checkpoint, args.config)
        conclusion = analyzer.generate_conclusion(args.logs)
        
        # Save conclusion to JSON file
        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        checkpoint_name = Path(args.checkpoint).stem
        conclusion_file = output_dir / f"conclusion_{checkpoint_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(conclusion_file, 'w') as f:
            json.dump(conclusion, f, indent=2)
        
        print(f"✅ Conclusion generated: {conclusion_file}")
        
        # Print executive summary if available
        if 'executive_summary' in conclusion:
            print(f"📊 Overall Status: {conclusion['executive_summary']['overall_status']}")
            print(f"🎯 Health Score: {conclusion['executive_summary']['health_score']}")
            print(f"🔄 Training Stage: {conclusion['executive_summary']['training_stage']}")
            print(f"📈 Current Epoch: {conclusion['executive_summary']['current_epoch']}")
            print(f"⚠️  Main Issue: {conclusion['executive_summary']['main_issue']}")
        elif 'error' in conclusion:
            print(f"❌ Analysis Error: {conclusion['error']}")
        
        # Print key recommendations
        if 'actionable_insights' in conclusion and 'critical_issues' in conclusion['actionable_insights']:
            critical_issues = conclusion['actionable_insights']['critical_issues']
            if critical_issues:
                print("\n🚨 Critical Issues:")
                for issue in critical_issues:
                    print(f"   • {issue.get('description', issue.get('action', 'Unknown issue'))}")
            else:
                print("\n✅ No critical issues detected")
        
        # Print next action recommendations
        if 'next_actions' in conclusion:
            next_action = conclusion['next_actions'].get('recommended_action', 'Unknown')
            print(f"\n🎯 Next Action: {next_action}")
            
            can_continue = conclusion['next_actions'].get('can_continue_training', False)
            if can_continue:
                print("✅ Training can continue")
            else:
                print("⚠️  Training should be paused for fixes")
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()