#!/usr/bin/env python3
"""
Mathematical Computation Service
# All mathematical formulas used in Bailando training and validation
"""

import torch
import torch.nn.functional as F
import numpy as np
from typing import Tuple, Dict

class MathService:
    """
    # Service containing all mathematical computations for Bailando
    # Implements formulas from the paper with clear mathematical notation
    """
    
    @staticmethod
    def vq_vae_loss(x_recon: torch.Tensor, x_orig: torch.Tensor, 
                    z_e: torch.Tensor, z_q: torch.Tensor, beta: float = 0.25) -> Tuple[torch.Tensor, Dict]:
        """
        # VQ-VAE Loss computation
        # Formula: L_vq = ||x - D(E(x))||² + ||sg[z_e] - z_q||² + β||z_e - sg[z_q]||²
        # Where: sg = stop_gradient operator
        """
        # Reconstruction loss: ||x - x_recon||²
        recon_loss = F.mse_loss(x_recon, x_orig)
        
        # VQ loss: ||sg[z_e] - z_q||²  
        vq_loss = F.mse_loss(z_q.detach(), z_e)
        
        # Commitment loss: β * ||z_e - sg[z_q]||²
        commit_loss = beta * F.mse_loss(z_e, z_q.detach())
        
        # Total loss
        total_loss = recon_loss + vq_loss + commit_loss
        
        losses = {
            'total': total_loss,
            'reconstruction': recon_loss,
            'vq': vq_loss,
            'commitment': commit_loss
        }
        
        return total_loss, losses
    
    @staticmethod
    def gpt_loss(logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        # GPT Cross-entropy loss
        # Formula: L_gpt = -∑_{t=1}^T log P(x_t|x_{<t}, c_music)
        """
        return torch.nn.CrossEntropyLoss()(logits.view(-1, logits.size(-1)), targets.view(-1))
    
    @staticmethod
    def actor_critic_loss(advantages: torch.Tensor, log_probs: torch.Tensor,
                         values: torch.Tensor, returns: torch.Tensor,
                         entropy: torch.Tensor, clip_eps: float = 0.2) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        # Actor-Critic PPO loss computation
        # Formula: L_actor = -A(s,a) * log π(a|s), L_critic = MSE(V(s) - R)
        """
        # Actor loss: -A(s,a) * log π(a|s)
        actor_loss = -(advantages * log_probs).mean()
        
        # Critic loss: MSE(V(s) - R)
        critic_loss = F.mse_loss(values, returns)
        
        return actor_loss, critic_loss
    
    @staticmethod
    def beat_alignment_score(motion_beats: np.ndarray, music_beats: np.ndarray) -> float:
        """
        # Beat alignment score calculation
        # Formula: S_beat = (1/T) * ∑cos(θ_music - θ_motion)
        """
        if len(motion_beats) != len(music_beats):
            min_len = min(len(motion_beats), len(music_beats))
            motion_beats = motion_beats[:min_len]
            music_beats = music_beats[:min_len]
        
        # Calculate phase difference and cosine similarity
        phase_diff = music_beats - motion_beats
        alignment = np.mean(np.cos(phase_diff))
        
        return float(alignment)
    
    @staticmethod
    def motion_diversity_fid(real_features: np.ndarray, gen_features: np.ndarray) -> float:
        """
        # Motion diversity using Fréchet Inception Distance
        # Formula: FID = ||μ_real - μ_gen||² + Tr(Σ_real + Σ_gen - 2√(Σ_real*Σ_gen))
        """
        # Calculate means
        mu_real = np.mean(real_features, axis=0)
        mu_gen = np.mean(gen_features, axis=0)
        
        # Calculate covariances
        sigma_real = np.cov(real_features, rowvar=False)
        sigma_gen = np.cov(gen_features, rowvar=False)
        
        # Calculate FID
        mu_diff = mu_real - mu_gen
        fid = np.dot(mu_diff, mu_diff) + np.trace(sigma_real + sigma_gen - 2 * np.sqrt(sigma_real @ sigma_gen))
        
        return float(fid)
    
    @staticmethod
    def foot_skating_error(foot_positions: np.ndarray, foot_contacts: np.ndarray) -> float:
        """
        # Foot skating error calculation
        # Formula: S_skate = (1/T) * ∑||v_foot||² when foot_contact = 1
        """
        # Calculate foot velocities
        foot_velocities = np.diff(foot_positions, axis=0)
        
        # Only consider frames where foot is in contact
        contact_frames = foot_contacts[1:] == 1
        skating_velocities = foot_velocities[contact_frames]
        
        if len(skating_velocities) == 0:
            return 0.0
        
        # Calculate mean squared velocity during contact
        skating_error = np.mean(np.sum(skating_velocities ** 2, axis=-1))
        
        return float(skating_error)
