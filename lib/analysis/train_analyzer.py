import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional

class TrainingAnalyzer:
    """Analyzes training progression and patterns"""
    
    def __init__(self):
        self.paper_benchmarks = {
            "vq_vae_target_loss": 30,
            "gpt_target_loss": 2.5,
            "actor_critic_improvement": 0.1,
            "max_stable_loss": 100,
            "explosion_threshold": 500
        }
    
    def load_training_history(self, logs_dir: str) -> List[Dict]:
        """Load all training state files"""
        logs_path = Path(logs_dir)
        training_history = []
        
        for json_file in logs_path.glob("training_state_*.json"):
            try:
                with open(json_file, 'r') as f:
                    state = json.load(f)
                    training_history.append(state)
            except Exception:
                continue
        
        # Sort by stage and epoch
        training_history.sort(key=lambda x: (x.get('stage', 0), x.get('epoch', 0)))
        return training_history
    
    def analyze_loss_progression(self, training_history: List[Dict]) -> Dict:
        """Analyze loss progression patterns"""
        if not training_history:
            return {"status": "no_data"}
        
        losses = [state.get('loss', 0) for state in training_history]
        epochs = [state.get('epoch', 0) for state in training_history]
        
        # Basic statistics
        loss_stats = {
            "initial_loss": losses[0] if losses else 0,
            "final_loss": losses[-1] if losses else 0,
            "min_loss": min(losses) if losses else 0,
            "max_loss": max(losses) if losses else 0,
            "mean_loss": np.mean(losses) if losses else 0,
            "loss_volatility": np.std(losses) if losses else 0
        }
        
        # Trend analysis
        trend = self._analyze_trend(losses)
        
        # Explosion detection
        explosion_detected = any(l > self.paper_benchmarks["explosion_threshold"] for l in losses)
        explosion_epochs = [e for e, l in zip(epochs, losses) 
                          if l > self.paper_benchmarks["explosion_threshold"]]
        
        # Jump analysis
        jumps = self._analyze_jumps(losses, epochs)
        
        return {
            "status": "analyzed",
            "statistics": loss_stats,
            "trend": trend,
            "explosion_detected": explosion_detected,
            "explosion_epochs": explosion_epochs,
            "jump_analysis": jumps,
            "paper_comparison": self._compare_with_paper_targets(loss_stats)
        }
    
    def _analyze_trend(self, losses: List[float]) -> str:
        """Analyze overall loss trend"""
        if len(losses) < 3:
            return "insufficient_data"
        
        # Use recent window for trend
        window_size = min(10, len(losses) // 2)
        recent_losses = losses[-window_size:]
        
        # Linear regression on recent losses
        x = np.arange(len(recent_losses))
        slope = np.polyfit(x, recent_losses, 1)[0]
        
        # Classify trend
        if slope > 50:
            return "explosive_divergence"
        elif slope > 10:
            return "strong_increasing"
        elif slope > 1:
            return "mild_increasing"
        elif slope > -1:
            return "stable_oscillating"
        elif slope > -10:
            return "mild_decreasing"
        else:
            return "converging"
    
    def _analyze_jumps(self, losses: List[float], epochs: List[int]) -> Dict:
        """Analyze sudden loss jumps"""
        if len(losses) < 2:
            return {"total_jumps": 0, "major_jumps": []}
        
        jumps = []
        for i in range(1, len(losses)):
            ratio = losses[i] / losses[i-1] if losses[i-1] > 0 else float('inf')
            absolute_change = losses[i] - losses[i-1]
            
            if ratio > 1.5 or absolute_change > 50:  # Significant jump
                jumps.append({
                    "epoch": epochs[i],
                    "from_loss": losses[i-1],
                    "to_loss": losses[i],
                    "ratio": ratio,
                    "absolute_change": absolute_change,
                    "severity": "major" if ratio > 2 else "moderate"
                })
        
        return {
            "total_jumps": len(jumps),
            "major_jumps": [j for j in jumps if j["severity"] == "major"],
            "jump_frequency": len(jumps) / len(losses) if losses else 0,
            "largest_jump": max(jumps, key=lambda x: x["ratio"]) if jumps else None
        }
    
    def _compare_with_paper_targets(self, loss_stats: Dict) -> Dict:
        """Compare current performance with paper targets"""
        current_loss = loss_stats.get("final_loss", 0)
        min_loss = loss_stats.get("min_loss", 0)
        
        # VQ-VAE stage comparison
        vq_vae_performance = {
            "target": self.paper_benchmarks["vq_vae_target_loss"],
            "current": current_loss,
            "best_achieved": min_loss,
            "distance_to_target": current_loss - self.paper_benchmarks["vq_vae_target_loss"],
            "on_track": current_loss < self.paper_benchmarks["max_stable_loss"]
        }
        
        return {
            "vq_vae_stage": vq_vae_performance,
            "stability_assessment": "stable" if current_loss < 100 else "unstable",
            "paper_alignment": "good" if min_loss < 50 else "poor"
        }
    
    def calculate_training_stability(self, training_history: List[Dict]) -> Dict:
        """Calculate comprehensive stability metrics"""
        if len(training_history) < 5:
            return {"score": 0, "status": "insufficient_data"}
        
        losses = [state.get('loss', 0) for state in training_history]
        
        # Coefficient of variation
        mean_loss = np.mean(losses)
        std_loss = np.std(losses)
        cv = std_loss / mean_loss if mean_loss > 0 else float('inf')
        
        # Jump frequency
        jumps = sum(1 for i in range(1, len(losses)) 
                   if losses[i] > losses[i-1] * 1.5)
        jump_frequency = jumps / len(losses)
        
        # Explosion frequency
        explosions = sum(1 for loss in losses 
                        if loss > self.paper_benchmarks["explosion_threshold"])
        explosion_rate = explosions / len(losses)
        
        # Overall stability score (0-1, higher is better)
        stability = max(0, min(1, 1 - cv/5 - jump_frequency*2 - explosion_rate*3))
        
        # Status classification
        if stability > 0.8:
            status = "excellent"
        elif stability > 0.6:
            status = "good"
        elif stability > 0.4:
            status = "moderate"
        elif stability > 0.2:
            status = "poor"
        else:
            status = "critical"
        
        return {
            "score": round(stability, 3),
            "status": status,
            "coefficient_variation": round(cv, 3),
            "jump_frequency": round(jump_frequency, 3),
            "explosion_rate": round(explosion_rate, 3),
            "total_explosions": explosions,
            "recommendation": self._get_stability_recommendation(stability)
        }
    
    def _get_stability_recommendation(self, stability_score: float) -> str:
        """Get recommendation based on stability score"""
        if stability_score > 0.8:
            return "continue_current_configuration"
        elif stability_score > 0.6:
            return "minor_adjustments_recommended"
        elif stability_score > 0.4:
            return "reduce_learning_rate"
        elif stability_score > 0.2:
            return "major_configuration_changes_needed"
        else:
            return "restart_with_stable_configuration"
    
    def analyze_convergence(self, training_history: List[Dict]) -> Dict:
        """Analyze convergence patterns and estimate completion"""
        if len(training_history) < 10:
            return {"status": "insufficient_data"}
        
        losses = [state.get('loss', 0) for state in training_history]
        epochs = [state.get('epoch', 0) for state in training_history]
        
        # Recent improvement analysis
        recent_window = min(20, len(losses) // 2)
        recent_losses = losses[-recent_window:]
        
        if len(recent_losses) >= 2:
            improvement_rate = (recent_losses[0] - recent_losses[-1]) / len(recent_losses)
        else:
            improvement_rate = 0
        
        # Convergence detection
        variance_recent = np.var(recent_losses) if len(recent_losses) > 1 else float('inf')
        mean_recent = np.mean(recent_losses)
        
        # Determine convergence status
        if variance_recent < 0.01 * mean_recent and improvement_rate > -1:
            convergence_status = "converged"
            epochs_to_convergence = 0
        elif improvement_rate > 1:
            convergence_status = "improving"
            epochs_to_convergence = self._estimate_convergence_time(losses)
        elif improvement_rate < -10:
            convergence_status = "diverging"
            epochs_to_convergence = None
        else:
            convergence_status = "oscillating"
            epochs_to_convergence = None
        
        return {
            "status": convergence_status,
            "improvement_rate": round(improvement_rate, 4),
            "recent_variance": round(variance_recent, 4),
            "estimated_epochs_to_convergence": epochs_to_convergence,
            "convergence_confidence": self._calculate_convergence_confidence(losses)
        }
    
    def _estimate_convergence_time(self, losses: List[float]) -> Optional[int]:
        """Estimate epochs needed for convergence"""
        if len(losses) < 5:
            return None
        
        recent_losses = losses[-min(10, len(losses)):]
        if len(recent_losses) < 2:
            return None
        
        # Linear extrapolation
        x = np.arange(len(recent_losses))
        slope = np.polyfit(x, recent_losses, 1)[0]
        
        if slope >= 0:  # Not improving
            return None
        
        current_loss = recent_losses[-1]
        target_loss = self.paper_benchmarks["vq_vae_target_loss"]
        
        if current_loss <= target_loss:
            return 0
        
        epochs_needed = int((current_loss - target_loss) / abs(slope))
        return min(epochs_needed, 500)  # Cap at reasonable number
    
    def _calculate_convergence_confidence(self, losses: List[float]) -> float:
        """Calculate confidence in convergence prediction"""
        if len(losses) < 10:
            return 0.1
        
        recent_losses = losses[-10:]
        trend_consistency = 1 - (np.std(np.diff(recent_losses)) / np.mean(recent_losses))
        trend_consistency = max(0, min(1, trend_consistency))
        
        return round(trend_consistency, 2)
    
    def analyze_progression(self, logs_dir: str) -> Dict:
        """Main analysis function - orchestrates all analyses"""
        training_history = self.load_training_history(logs_dir)
        
        if not training_history:
            return {
                "status": "no_training_data",
                "message": "No training history found in logs directory"
            }
        
        return {
            "status": "analysis_complete",
            "total_epochs": len(training_history),
            "loss_progression": self.analyze_loss_progression(training_history),
            "training_stability": self.calculate_training_stability(training_history),
            "convergence_analysis": self.analyze_convergence(training_history),
            "stage_breakdown": self._analyze_by_stages(training_history)
        }
    
    def _analyze_by_stages(self, training_history: List[Dict]) -> Dict:
        """Analyze performance by training stages"""
        stages = {}
        
        for state in training_history:
            stage = state.get('stage', 1)
            if stage not in stages:
                stages[stage] = []
            stages[stage].append(state)
        
        stage_analysis = {}
        for stage, states in stages.items():
            losses = [s.get('loss', 0) for s in states]
            
            stage_analysis[f"stage_{stage}"] = {
                "epochs_completed": len(states),
                "loss_progression": {
                    "initial": losses[0] if losses else 0,
                    "final": losses[-1] if losses else 0,
                    "best": min(losses) if losses else 0,
                    "worst": max(losses) if losses else 0
                },
                "improvement": losses[0] - losses[-1] if len(losses) > 1 else 0,
                "stability": "stable" if all(l < 200 for l in losses) else "unstable",
                "completion_status": self._assess_stage_completion(stage, len(states), losses)
            }
        
        return stage_analysis
    
    def _assess_stage_completion(self, stage: int, epochs_completed: int, losses: List[float]) -> str:
        """Assess if a training stage is complete"""
        expected_epochs = {1: 50, 2: 25, 3: 15}  # For stable config
        
        if epochs_completed >= expected_epochs.get(stage, 50):
            return "completed"
        elif losses and losses[-1] < self.paper_benchmarks["vq_vae_target_loss"]:
            return "early_convergence"
        elif epochs_completed > expected_epochs.get(stage, 50) * 0.7:
            return "near_completion"
        else:
            return "in_progress"