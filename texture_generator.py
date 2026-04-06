#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自然纹理生成器
用于生成木纹、石纹、皮革等自然纹理，适用于游戏开发

使用说明：
1. 安装依赖：pip install pillow noise -i https://mirrors.aliyun.com/pypi/simple/
2. 配置参数：修改下方的配置变量
3. 运行脚本：python texture_generator.py
"""

import os
import math
import random
from PIL import Image, ImageDraw
import noise

# 配置参数
CONFIG = {
    # 输出目录
    'output_dir': 'textures',
    # 纹理尺寸
    'width': 512,
    'height': 512,
    # 纹理类型：wood, stone, leather
    'texture_type': 'leather',
    # 木纹参数
    'wood': {
        'grain_size': 0.01,  # 纹理颗粒大小
        'grain_intensity': 3.0,  # 纹理强度
        'color_base': (139, 69, 19),  # 基础颜色（棕色）
        'color_variation': 50,  # 颜色变化范围
    },
    # 石纹参数
    'stone': {
        'noise_scale': 0.02,  # 噪声缩放
        'noise_octaves': 3,  # 噪声八度
        'color_base': (128, 128, 128),  # 基础颜色（灰色）
        'color_variation': 30,  # 颜色变化范围
    },
    # 皮革纹理参数
    'leather': {
        'noise_scale': 0.03,  # 噪声缩放
        'noise_octaves': 4,  # 噪声八度
        'color_base': (139, 69, 19),  # 基础颜色（棕色）
        'color_variation': 40,  # 颜色变化范围
    }
}

def create_output_dir():
    """创建输出目录"""
    if not os.path.exists(CONFIG['output_dir']):
        os.makedirs(CONFIG['output_dir'])

def generate_wood_texture():
    """生成木纹纹理"""
    width, height = CONFIG['width'], CONFIG['height']
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    grain_size = CONFIG['wood']['grain_size']
    grain_intensity = CONFIG['wood']['grain_intensity']
    base_r, base_g, base_b = CONFIG['wood']['color_base']
    color_variation = CONFIG['wood']['color_variation']
    
    for y in range(height):
        for x in range(width):
            # 生成木纹效果
            noise_val = noise.pnoise2(
                x * grain_size,
                y * grain_size * 0.1,  # Y方向噪声更小，模拟木纹纵向纹理
                octaves=2,
                persistence=0.5,
                lacunarity=2.0,
                repeatx=1024,
                repeaty=1024,
                base=0
            )
            
            # 计算颜色变化
            variation = int(noise_val * color_variation * grain_intensity)
            r = max(0, min(255, base_r + variation))
            g = max(0, min(255, base_g + variation // 2))  # 绿色变化较小
            b = max(0, min(255, base_b - variation // 3))  # 蓝色变化相反
            
            draw.point((x, y), fill=(r, g, b))
    
    # 添加年轮效果
    center_x, center_y = width // 2, height // 2
    max_radius = min(center_x, center_y)
    
    for radius in range(5, max_radius, 15):
        for angle in range(0, 360, 5):
            x = int(center_x + radius * math.cos(math.radians(angle)))
            y = int(center_y + radius * math.sin(math.radians(angle)))
            if 0 <= x < width and 0 <= y < height:
                # 年轮颜色稍深
                r, g, b = img.getpixel((x, y))
                img.putpixel((x, y), (max(0, r - 20), max(0, g - 10), max(0, b - 5)))
    
    output_path = os.path.join(CONFIG['output_dir'], 'wood_texture.png')
    img.save(output_path)
    print(f"木纹纹理已保存至: {output_path}")

def generate_stone_texture():
    """生成石纹纹理"""
    width, height = CONFIG['width'], CONFIG['height']
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    noise_scale = CONFIG['stone']['noise_scale']
    noise_octaves = CONFIG['stone']['noise_octaves']
    base_r, base_g, base_b = CONFIG['stone']['color_base']
    color_variation = CONFIG['stone']['color_variation']
    
    for y in range(height):
        for x in range(width):
            # 生成石纹效果
            noise_val = noise.pnoise2(
                x * noise_scale,
                y * noise_scale,
                octaves=noise_octaves,
                persistence=0.5,
                lacunarity=2.0,
                repeatx=1024,
                repeaty=1024,
                base=0
            )
            
            # 计算颜色变化
            variation = int(noise_val * color_variation)
            r = max(0, min(255, base_r + variation))
            g = max(0, min(255, base_g + variation))
            b = max(0, min(255, base_b + variation))
            
            draw.point((x, y), fill=(r, g, b))
    
    output_path = os.path.join(CONFIG['output_dir'], 'stone_texture.png')
    img.save(output_path)
    print(f"石纹纹理已保存至: {output_path}")

def generate_leather_texture():
    """生成皮革纹理"""
    width, height = CONFIG['width'], CONFIG['height']
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    noise_scale = CONFIG['leather']['noise_scale']
    noise_octaves = CONFIG['leather']['noise_octaves']
    base_r, base_g, base_b = CONFIG['leather']['color_base']
    color_variation = CONFIG['leather']['color_variation']
    
    for y in range(height):
        for x in range(width):
            # 生成皮革纹理效果
            noise_val = noise.pnoise2(
                x * noise_scale,
                y * noise_scale,
                octaves=noise_octaves,
                persistence=0.5,
                lacunarity=2.0,
                repeatx=1024,
                repeaty=1024,
                base=0
            )
            
            # 计算颜色变化
            variation = int(noise_val * color_variation)
            r = max(0, min(255, base_r + variation))
            g = max(0, min(255, base_g + variation // 2))  # 绿色变化较小
            b = max(0, min(255, base_b - variation // 3))  # 蓝色变化相反
            
            draw.point((x, y), fill=(r, g, b))
    
    # 添加皮革毛孔效果
    for _ in range(width * height // 100):  # 毛孔数量
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        radius = random.randint(1, 3)
        
        # 毛孔颜色稍深
        r, g, b = img.getpixel((x, y))
        pore_color = (max(0, r - 30), max(0, g - 20), max(0, b - 10))
        
        # 绘制毛孔
        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                if dx*dx + dy*dy <= radius*radius:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        img.putpixel((nx, ny), pore_color)
    
    output_path = os.path.join(CONFIG['output_dir'], 'leather_texture.png')
    img.save(output_path)
    print(f"皮革纹理已保存至: {output_path}")

def main():
    """主函数"""
    create_output_dir()
    
    texture_type = CONFIG['texture_type']
    
    if texture_type == 'wood':
        generate_wood_texture()
    elif texture_type == 'stone':
        generate_stone_texture()
    elif texture_type == 'leather':
        generate_leather_texture()
    else:
        print(f"不支持的纹理类型: {texture_type}")
        print("支持的纹理类型: wood, stone, leather")

if __name__ == "__main__":
    main()
