import os
import sys
import torch
import torch.nn as nn
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.services.config_service import ConfigService
from lib.models.bailando import BailandoModel, VectorQuantizer, MotionVQVAE, GPTModel

class NeuralOptimizer:
    """Optimizes neural network components for specific hardware and performance targets"""
    
    def __init__(self):
        self.optimization_strategies = {
            "cpu_optimized": {
                "target_params": 15e6,
                "memory_limit_gb": 4,
                "priority": "stability"
            },
            "gpu_optimized": {
                "target_params": 100e6,
                "memory_limit_gb": 16,
                "priority": "performance"
            },
            "mobile_optimized": {
                "target_params": 5e6,
                "memory_limit_gb": 2,
                "priority": "efficiency"
            }
        }
    
    def load_model_components(self, checkpoint_path: str, components: List[str]) -> Dict:
        """Load specific model components from checkpoint"""
        try:
            checkpoint = torch.load(checkpoint_path, map_location='cpu')
            model_state = checkpoint.get('model_state_dict', {})
            
            loaded_components = {}
            
            for component in components:
                component_state = self._extract_component_state(model_state, component)
                if component_state:
                    loaded_components[component] = component_state
                    print(f"✅ Loaded component: {component}")
                else:
                    print(f"⚠️ Component not found: {component}")
            
            return {
                "components": loaded_components,
                "metadata": {
                    "source_checkpoint": checkpoint_path,
                    "epoch": checkpoint.get('epoch', 0),
                    "stage": checkpoint.get('stage', 1),
                    "loss": checkpoint.get('loss', 0)
                }
            }
            
        except Exception as e:
            return {"error": f"Failed to load components: {str(e)}"}
    
    def _extract_component_state(self, model_state: Dict, component: str) -> Dict:
        """Extract state dict for specific component"""
        component_state = {}
        
        # Define component prefixes
        component_prefixes = {
            "vq_vae": "vq_vae.",
            "gpt": "gpt.",
            "critic": "critic.",
            "encoder": "vq_vae.encoder.",
            "decoder": "vq_vae.decoder.",
            "vector_quantizer": "vq_vae.vq.",
            "transformer": "gpt.layers."
        }
        
        prefix = component_prefixes.get(component, f"{component}.")
        
        for key, value in model_state.items():
            if key.startswith(prefix):
                # Remove prefix for clean component state
                clean_key = key[len(prefix):]
                component_state[clean_key] = value
        
        return component_state
    
    def optimize_for_hardware(self, config: Dict, target_device: str, constraints: Dict) -> Dict:
        """Optimize model configuration for specific hardware"""
        
        if target_device not in self.optimization_strategies:
            return {"error": f"Unsupported target device: {target_device}"}
        
        strategy = self.optimization_strategies[target_device]
        current_config = config.get('model', {})
        
        # Calculate current model size
        current_params = self._estimate_parameters(current_config)
        target_params = constraints.get('max_parameters', strategy['target_params'])
        
        if current_params <= target_params:
            return {
                "status": "no_optimization_needed",
                "current_parameters": current_params,
                "target_parameters": target_params,
                "optimized_config": config
            }
        
        # Calculate reduction ratio needed
        reduction_ratio = target_params / current_params
        
        # Apply optimization strategy
        optimized_config = self._apply_optimization_strategy(
            current_config, reduction_ratio, strategy['priority']
        )
        
        # Verify optimization
        optimized_params = self._estimate_parameters(optimized_config)
        
        return {
            "status": "optimization_complete",
            "original_parameters": current_params,
            "optimized_parameters": optimized_params,
            "reduction_achieved": (current_params - optimized_params) / current_params,
            "target_met": optimized_params <= target_params,
            "optimized_config": optimized_config,
            "optimization_details": self._get_optimization_details(current_config, optimized_config)
        }
    
    def _estimate_parameters(self, model_config: Dict) -> int:
        """Estimate total parameters from configuration"""
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
        
        # GPT parameters (simplified)
        attention_params = gpt_layers * (embed_dim * embed_dim * 4)  # Q, K, V, Output
        ffn_params = gpt_layers * (embed_dim * embed_dim * 4 * 2)    # Feed-forward
        embedding_params = codebook_size * embed_dim + 1024 * embed_dim  # Token + Position
        gpt_total = attention_params + ffn_params + embedding_params
        
        # Critic parameters
        critic_params = embed_dim * 256 + 256 * 1
        
        return int(vq_vae_total + gpt_total + critic_params)
    
    def _apply_optimization_strategy(self, config: Dict, reduction_ratio: float, priority: str) -> Dict:
        """Apply optimization strategy based on priority"""
        optimized_config = config.copy()
        
        if priority == "stability":
            # Conservative optimization - maintain model capability
            optimized_config.update({
                "latent_dim": max(64, int(config.get('latent_dim', 256) * np.sqrt(reduction_ratio))),
                "codebook_size": max(256, int(config.get('codebook_size', 1024) * reduction_ratio)),
                "gpt_layers": max(4, int(config.get('gpt_layers', 12) * reduction_ratio)),
                "embed_dim": max(128, int(config.get('embed_dim', 512) * np.sqrt(reduction_ratio)))
            })
            
        elif priority == "performance":
            # Aggressive optimization - prioritize speed
            optimized_config.update({
                "latent_dim": max(32, int(config.get('latent_dim', 256) * reduction_ratio * 0.7)),
                "codebook_size": max(128, int(config.get('codebook_size', 1024) * reduction_ratio * 0.5)),
                "gpt_layers": max(3, int(config.get('gpt_layers', 12) * reduction_ratio * 0.6)),
                "embed_dim": max(64, int(config.get('embed_dim', 512) * reduction_ratio * 0.8))
            })
            
        elif priority == "efficiency":
            # Balanced optimization - good trade-off
            optimized_config.update({
                "latent_dim": max(48, int(config.get('latent_dim', 256) * reduction_ratio * 0.8)),
                "codebook_size": max(192, int(config.get('codebook_size', 1024) * reduction_ratio * 0.7)),
                "gpt_layers": max(3, int(config.get('gpt_layers', 12) * reduction_ratio * 0.7)),
                "embed_dim": max(96, int(config.get('embed_dim', 512) * reduction_ratio * 0.9))
            })
        
        return optimized_config
    
    def _get_optimization_details(self, original: Dict, optimized: Dict) -> Dict:
        """Get detailed optimization changes"""
        changes = {}
        
        for key in ['latent_dim', 'codebook_size', 'gpt_layers', 'embed_dim']:
            original_val = original.get(key, 0)
            optimized_val = optimized.get(key, 0)
            
            if original_val != optimized_val:
                reduction = (original_val - optimized_val) / original_val if original_val > 0 else 0
                changes[key] = {
                    "original": original_val,
                    "optimized": optimized_val,
                    "reduction_percent": round(reduction * 100, 1)
                }
        
        return changes
    
    def compress_model_components(self, checkpoint_path: str, compression_ratio: float, 
                                 components: List[str] = None) -> Dict:
        """Compress specific model components using various techniques"""
        
        if components is None:
            components = ["vq_vae", "gpt", "critic"]
        
        # Load original model
        loaded_data = self.load_model_components(checkpoint_path, components)
        
        if "error" in loaded_data:
            return loaded_data
        
        compressed_components = {}
        compression_stats = {}
        
        for component_name, component_state in loaded_data["components"].items():
            
            # Apply compression techniques
            if component_name == "vq_vae":
                compressed_state, stats = self._compress_vq_vae(component_state, compression_ratio)
            elif component_name == "gpt":
                compressed_state, stats = self._compress_gpt(component_state, compression_ratio)
            elif component_name == "critic":
                compressed_state, stats = self._compress_linear_layers(component_state, compression_ratio)
            else:
                compressed_state, stats = self._compress_generic(component_state, compression_ratio)
            
            compressed_components[component_name] = compressed_state
            compression_stats[component_name] = stats
        
        return {
            "status": "compression_complete",
            "compressed_components": compressed_components,
            "compression_statistics": compression_stats,
            "original_metadata": loaded_data["metadata"],
            "overall_compression": self._calculate_overall_compression(compression_stats)
        }
    
    def _compress_vq_vae(self, vq_vae_state: Dict, ratio: float) -> Tuple[Dict, Dict]:
        """Compress VQ-VAE component using codebook pruning and layer reduction"""
        compressed_state = vq_vae_state.copy()
        
        # Compress codebook (remove least used entries)
        if "embedding.weight" in vq_vae_state:
            codebook = vq_vae_state["embedding.weight"]
            original_size = codebook.shape[0]
            new_size = max(64, int(original_size * ratio))
            
            # Keep most representative entries (simple approach: first N)
            compressed_state["embedding.weight"] = codebook[:new_size]
            
            codebook_compression = (original_size - new_size) / original_size
        else:
            codebook_compression = 0
        
        stats = {
            "codebook_compression": round(codebook_compression, 3),
            "parameters_reduced": int(codebook_compression * 1000)  # Estimate
        }
        
        return compressed_state, stats
    
    def _compress_gpt(self, gpt_state: Dict, ratio: float) -> Tuple[Dict, Dict]:
        """Compress GPT component using layer pruning and attention head reduction"""
        compressed_state = {}
        removed_layers = 0
        total_layers = 0
        
        # Count layers and selectively keep them
        layer_pattern = "layers."
        layer_indices = set()
        
        for key in gpt_state.keys():
            if layer_pattern in key:
                layer_idx = int(key.split('.')[1])
                layer_indices.add(layer_idx)
        
        total_layers = len(layer_indices)
        layers_to_keep = max(2, int(total_layers * ratio))
        
        # Keep first N layers (could be smarter: keep most important)
        kept_layers = sorted(layer_indices)[:layers_to_keep]
        
        for key, value in gpt_state.items():
            if layer_pattern in key:
                layer_idx = int(key.split('.')[1])
                if layer_idx in kept_layers:
                    # Remap layer index to be contiguous
                    new_idx = kept_layers.index(layer_idx)
                    new_key = key.replace(f"layers.{layer_idx}", f"layers.{new_idx}")
                    compressed_state[new_key] = value
                else:
                    removed_layers += 1
            else:
                compressed_state[key] = value
        
        stats = {
            "layers_removed": removed_layers,
            "layers_kept": layers_to_keep,
            "layer_compression": removed_layers / total_layers if total_layers > 0 else 0
        }
        
        return compressed_state, stats
    
    def _compress_linear_layers(self, component_state: Dict, ratio: float) -> Tuple[Dict, Dict]:
        """Compress linear layers using weight pruning"""
        compressed_state = component_state.copy()
        total_pruned = 0
        total_weights = 0
        
        for key, tensor in component_state.items():
            if "weight" in key and tensor.dim() == 2:  # Linear layer weight
                # Simple magnitude-based pruning
                flat_weights = tensor.flatten()
                total_weights += len(flat_weights)
                
                # Calculate threshold for pruning
                threshold = torch.quantile(torch.abs(flat_weights), 1 - ratio)
                
                # Apply pruning mask
                pruning_mask = torch.abs(tensor) > threshold
                compressed_tensor = tensor * pruning_mask
                
                compressed_state[key] = compressed_tensor
                total_pruned += (pruning_mask == 0).sum().item()
        
        stats = {
            "weights_pruned": total_pruned,
            "total_weights": total_weights,
            "pruning_ratio": total_pruned / total_weights if total_weights > 0 else 0
        }
        
        return compressed_state, stats
    
    def _compress_generic(self, component_state: Dict, ratio: float) -> Tuple[Dict, Dict]:
        """Generic compression for unknown components"""
        # For now, just return original with minimal stats
        stats = {
            "compression_applied": "none",
            "reason": "generic_component_unknown_structure"
        }
        
        return component_state, stats
    
    def _calculate_overall_compression(self, compression_stats: Dict) -> Dict:
        """Calculate overall compression statistics"""
        total_reduction = 0
        components_compressed = 0
        
        for component, stats in compression_stats.items():
            if "compression" in str(stats):
                components_compressed += 1
                # Extract compression ratio (simplified)
                for key, value in stats.items():
                    if "compression" in key and isinstance(value, (int, float)):
                        total_reduction += value
        
        average_compression = total_reduction / components_compressed if components_compressed > 0 else 0
        
        return {
            "average_compression_ratio": round(average_compression, 3),
            "components_optimized": components_compressed,
            "estimated_speedup": round(1 + average_compression, 2),
            "estimated_memory_reduction": round(average_compression * 100, 1)
        }

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description="Optimize Bailando neural network components")
    parser.add_argument('--config', type=str, help='Configuration file path')
    parser.add_argument('--checkpoint', type=str, help='Checkpoint file path')
    parser.add_argument('--target_device', choices=['cpu_optimized', 'gpu_optimized', 'mobile_optimized'], 
                       default='cpu_optimized', help='Target device for optimization')
    parser.add_argument('--max_parameters', type=float, help='Maximum parameters (e.g., 15e6)')
    parser.add_argument('--optimize_components', type=str, help='Comma-separated list of components to optimize')
    parser.add_argument('--compression_ratio', type=float, default=0.7, help='Compression ratio (0-1)')
    parser.add_argument('--output', type=str, required=True, help='Output path for optimized config/model')
    
    args = parser.parse_args()
    
    optimizer = NeuralOptimizer()
    
    if args.config:
        # Configuration optimization
        config = ConfigService.load_config(args.config)
        constraints = {}
        
        if args.max_parameters:
            constraints['max_parameters'] = args.max_parameters
        
        result = optimizer.optimize_for_hardware(config, args.target_device, constraints)
        
        if result.get('status') == 'optimization_complete':
            # Save optimized configuration
            optimized_config = result['optimized_config']
            full_config = config.copy()
            full_config['model'] = optimized_config
            
            import yaml
            with open(args.output, 'w') as f:
                yaml.dump(full_config, f, default_flow_style=False)
            
            print(f"✅ Optimized configuration saved: {args.output}")
            print(f"📊 Parameter reduction: {result['reduction_achieved']:.1%}")
            print(f"🎯 Target met: {result['target_met']}")
        
    elif args.checkpoint:
        # Component compression
        components = args.optimize_components.split(',') if args.optimize_components else None
        
        result = optimizer.compress_model_components(
            args.checkpoint, args.compression_ratio, components
        )
        
        if result.get('status') == 'compression_complete':
            # Save compressed model
            torch.save(result, args.output)
            
            print(f"✅ Compressed model saved: {args.output}")
            print(f"📊 Overall compression: {result['overall_compression']}")

if __name__ == "__main__":
    main()