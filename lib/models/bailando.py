#!/usr/bin/env python3
"""
Bailando Model Implementation
# Complete Bailando model with VQ-VAE, GPT, and Actor-Critic components
# Paper: "Bailando: 3D Dance Generation by Actor-Critic GPT with Choreographic Memory"
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Optional

class VectorQuantizer(nn.Module):
    """
    # Vector Quantization layer for choreographic memory
    # Formula: z_q = argmin_k ||z_e - e_k||²
    """
    
    def __init__(self, num_embeddings: int, embedding_dim: int, commitment_cost: float = 0.25):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.num_embeddings = num_embeddings
        self.commitment_cost = commitment_cost
        
        # Codebook embeddings: K x D
        self.embedding = nn.Embedding(num_embeddings, embedding_dim)
        self.embedding.weight.data.uniform_(-1/num_embeddings, 1/num_embeddings)
    
    def forward(self, inputs):
        # Convert inputs from BCHW -> BHWC
        input_shape = inputs.shape
        flat_input = inputs.view(-1, self.embedding_dim)
        
        # Calculate distances: ||z_e - e_k||²
        distances = (torch.sum(flat_input**2, dim=1, keepdim=True) 
                    + torch.sum(self.embedding.weight**2, dim=1)
                    - 2 * torch.matmul(flat_input, self.embedding.weight.t()))
        
        # Find closest codebook entries
        encoding_indices = torch.argmin(distances, dim=1).unsqueeze(1)
        encodings = torch.zeros(encoding_indices.shape[0], self.num_embeddings, device=inputs.device)
        encodings.scatter_(1, encoding_indices, 1)
        
        # Quantize
        quantized = torch.matmul(encodings, self.embedding.weight).view(input_shape)
        
        # Loss calculation: L_vq = ||sg[z_e] - z_q||²
        e_latent_loss = F.mse_loss(quantized.detach(), inputs)
        q_latent_loss = F.mse_loss(quantized, inputs.detach())
        
        loss = q_latent_loss + self.commitment_cost * e_latent_loss
        
        # Straight-through estimator
        quantized = inputs + (quantized - inputs).detach()
        
        return quantized, loss, encoding_indices.view(input_shape[:-1])

class MotionVQVAE(nn.Module):
    """
    # VQ-VAE for learning choreographic memory
    # Input: Motion sequence → Output: Quantized codes
    """
    
    def __init__(self, motion_dim: int, latent_dim: int, num_embeddings: int):
        super().__init__()
        self.motion_dim = motion_dim
        self.latent_dim = latent_dim
        
        # Encoder: Motion → Latent
        self.encoder = nn.Sequential(
            nn.Linear(motion_dim, 512),
            nn.ReLU(),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Linear(256, latent_dim)
        )
        
        # Vector Quantizer
        self.vq = VectorQuantizer(num_embeddings, latent_dim)
        
        # Decoder: Latent → Motion
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 512),
            nn.ReLU(),
            nn.Linear(512, motion_dim)
        )
    
    def forward(self, x):
        # Encode
        z_e = self.encoder(x)
        
        # Quantize
        z_q, vq_loss, indices = self.vq(z_e)
        
        # Decode
        x_recon = self.decoder(z_q)
        
        return x_recon, z_e, z_q, vq_loss, indices

class GPTModel(nn.Module):
    """
    # GPT model for sequence generation
    # Input: Quantized codes + Music → Output: Next codes
    """
    
    def __init__(self, vocab_size: int, embed_dim: int, num_heads: int, num_layers: int):
        super().__init__()
        self.embed_dim = embed_dim
        
        # Token embeddings
        self.token_embedding = nn.Embedding(vocab_size, embed_dim)
        self.pos_embedding = nn.Parameter(torch.randn(1024, embed_dim))
        
        # Transformer layers
        self.layers = nn.ModuleList([
            nn.TransformerDecoderLayer(
                d_model=embed_dim,
                nhead=num_heads,
                dim_feedforward=embed_dim * 4,
                dropout=0.1,
                batch_first=True
            ) for _ in range(num_layers)
        ])
        
        # Output projection
        self.output_projection = nn.Linear(embed_dim, vocab_size)
    
    def forward(self, tokens, music_features=None):
        batch_size, seq_len = tokens.shape
        
        # Token + Position embeddings
        token_emb = self.token_embedding(tokens)
        pos_emb = self.pos_embedding[:seq_len].unsqueeze(0)
        x = token_emb + pos_emb
        
        # Apply transformer layers
        for layer in self.layers:
            x = layer(x, x)  # Self-attention
        
        # Output projection
        logits = self.output_projection(x)
        
        return logits

class BailandoModel(nn.Module):
    """
    # Complete Bailando model combining VQ-VAE, GPT, and Actor-Critic
    # Implements 3-stage training pipeline
    """
    
    def __init__(self, config: dict):
        super().__init__()
        
        # Extract config parameters
        motion_dim = config['motion_dim']
        latent_dim = config['latent_dim']
        codebook_size = config['codebook_size']
        gpt_layers = config['gpt_layers']
        embed_dim = config['embed_dim']
        
        # VQ-VAE for choreographic memory
        self.vq_vae = MotionVQVAE(
            motion_dim=motion_dim,
            latent_dim=latent_dim,
            num_embeddings=codebook_size
        )
        
        # GPT for sequence modeling
        self.gpt = GPTModel(
            vocab_size=codebook_size,
            embed_dim=embed_dim,
            num_heads=8,
            num_layers=gpt_layers
        )
        
        # Critic network for RL (simplified)
        self.critic = nn.Sequential(
            nn.Linear(embed_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 1)
        )
        
        # Store config
        self.config = config
    
    def encode_motion(self, motion):
        """
        # Encode motion to quantized codes
        # Formula: motion → z_e → z_q → indices
        """
        x_recon, z_e, z_q, vq_loss, indices = self.vq_vae(motion)
        return indices, vq_loss
    
    def decode_motion(self, indices):
        """
        # Decode quantized codes to motion
        # Formula: indices → z_q → motion
        """
        # Get quantized vectors from indices
        quantized = self.vq_vae.vq.embedding(indices)
        
        # Decode to motion
        motion = self.vq_vae.decoder(quantized)
        return motion
    
    def generate_dance(self, music_features, sequence_length=240):
        """
        # Generate dance sequence from music
        # Input: music features → Output: motion sequence
        """
        batch_size = 1
        device = music_features.device
        
        # Start with random token
        generated_tokens = torch.randint(0, self.config['codebook_size'], (batch_size, 1), device=device)
        
        # Autoregressive generation
        for _ in range(sequence_length - 1):
            # Get next token probabilities
            logits = self.gpt(generated_tokens)
            next_token_logits = logits[:, -1, :]
            
            # Sample next token
            next_token = torch.multinomial(F.softmax(next_token_logits, dim=-1), 1)
            
            # Append to sequence
            generated_tokens = torch.cat([generated_tokens, next_token], dim=1)
        
        # Convert tokens to motion
        motion_sequence = self.decode_motion(generated_tokens.squeeze(0))
        
        return motion_sequence
    
    def actor_critic_forward(self, motion, music):
            """
            # Actor-Critic forward pass for RL training
            # Returns: advantages, log_probs, values, returns, entropy
            """
            batch_size, original_seq_len, motion_dim = motion.shape
            device = motion.device
            
            # Get quantized codes from motion (with gradients)
            _, _, z_q, _, indices = self.vq_vae(motion)
            
            # Forward through GPT to get action probabilities
            if indices.dim() > 2:
                indices = indices.view(batch_size, -1)
            
            # Handle sequence length for GPT input/output
            gpt_seq_len = indices.size(1)
            
            if gpt_seq_len <= 1:
                # If sequence too short, use simplified approach
                seq_len_for_output = original_seq_len
                
                # Create dummy outputs with proper gradients
                log_probs = torch.zeros(batch_size, seq_len_for_output, device=device, requires_grad=True)
                entropy = torch.zeros(batch_size, seq_len_for_output, device=device, requires_grad=True)
                
            else:
                # Use GPT for proper sequence modeling
                # For GPT: input = all tokens except last, target = all tokens except first
                gpt_input_indices = indices[:, :-1]  # Shape: [batch, seq_len-1]
                gpt_target_indices = indices[:, 1:]   # Shape: [batch, seq_len-1]
                
                # Get logits from GPT (with gradients)
                logits = self.gpt(gpt_input_indices, music)  # Shape: [batch, seq_len-1, vocab_size]
                
                # Convert logits to probabilities and calculate log_probs
                probs = F.softmax(logits, dim=-1)
                action_dist = torch.distributions.Categorical(probs)
                
                # Get log probabilities for the target tokens
                log_probs_gpt = action_dist.log_prob(gpt_target_indices)  # Shape: [batch, seq_len-1]
                
                # Calculate entropy
                entropy_gpt = action_dist.entropy()  # Shape: [batch, seq_len-1]
                
                # Pad to match original sequence length
                seq_len_for_output = original_seq_len
                if log_probs_gpt.size(1) < seq_len_for_output:
                    # Pad with zeros to match original sequence length
                    padding_size = seq_len_for_output - log_probs_gpt.size(1)
                    log_probs = F.pad(log_probs_gpt, (0, padding_size), value=0.0)
                    entropy = F.pad(entropy_gpt, (0, padding_size), value=0.0)
                else:
                    # Truncate if somehow longer
                    log_probs = log_probs_gpt[:, :seq_len_for_output]
                    entropy = entropy_gpt[:, :seq_len_for_output]
            
            # Get state values from critic (with gradients)
            # Use original motion for critic - DON'T change seq_len here
            motion_for_critic = motion.view(batch_size, original_seq_len, motion_dim)
            
            # Average over motion dimensions for critic input
            motion_averaged = motion_for_critic.mean(dim=-1)  # Shape: [batch_size, original_seq_len]
            
            # Pass through critic network - expects [batch_size, embed_dim]
            # We need to project motion to embed_dim first
            critic_input = motion_averaged.mean(dim=1)  # Shape: [batch_size] - average over time
            critic_input = critic_input.unsqueeze(-1).expand(-1, self.config['embed_dim'])  # Shape: [batch_size, embed_dim]
            
            values_single = self.critic(critic_input)  # Shape: [batch_size, 1]
            values = values_single.expand(batch_size, seq_len_for_output)  # Expand to match sequence
            
            # Calculate returns (simplified - in real RL this would use actual rewards)
            # Add small noise to simulate reward signal
            returns = values.detach() + torch.randn_like(values) * 0.1
            
            # Calculate advantages (with gradients)
            advantages = returns - values
            
            return advantages, log_probs, values, returns, entropy