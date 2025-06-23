#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔮 周文王占卜系统后端测试工具 - 快速启动脚本

快速启动Gradio测试界面，无需复杂配置
"""

import sys
import os

# 检查依赖
try:
    import gradio as gr
    import requests
    import sseclient
    from PIL import Image
    print("✅ 所有依赖已安装")
except ImportError as e:
    print(f"❌ 缺少依赖: {e}")
    print("📦 请运行: pip install -r requirements.txt")
    sys.exit(1)

# 导入主测试器
from backend_tester import create_interface

if __name__ == "__main__":
    print("🔮 周文王占卜系统 - 后端API测试工具")
    print("=" * 50)
    print("📡 默认后端地址: http://localhost:3001")
    print("🌐 测试界面地址: http://localhost:7860")
    print("💡 请确保后端服务已启动")
    print("=" * 50)
    
    try:
        demo = create_interface()
        demo.launch(
            server_name="0.0.0.0",
            server_port=7860,
            share=False,
            inbrowser=True,
            show_error=True
        )
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        print("🔧 请检查端口7860是否被占用")
        sys.exit(1) 