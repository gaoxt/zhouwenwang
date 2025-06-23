#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔮 周文王占卜系统测试工具 - 配置文件

可以在这里自定义测试参数和服务地址
"""

# 默认后端服务配置
DEFAULT_BACKEND_URL = "http://localhost:3001"

# 导出给其他模块使用
BACKEND_URL = DEFAULT_BACKEND_URL

# 测试用例配置
TEST_QUESTIONS = {
    "六爻占卜": "请用六爻占卜为我预测今日运势，详细解读卦象含义",
    "奇门遁甲": "请用奇门遁甲为我分析当前时局，给出策略建议", 
    "简单测试": "你好，请简单回复一下",
    "复杂测试": "请详细解释中国传统占卜文化的历史发展和现代应用",
}

# 视觉分析测试问题
VISION_TEST_QUESTIONS = {
    "手相分析": "请分析这张手相图片，解读手纹含义和命理特征",
    "通用分析": "请详细分析这张图片，描述你看到的内容",
    "占卜相关": "这张图片是否与占卜、命理相关？请分析其含义",
}

# Gradio界面配置
GRADIO_CONFIG = {
    "server_name": "0.0.0.0",
    "server_port": 7860,
    "share": False,  # 设为True可以生成公网链接
    "inbrowser": True,
    "show_error": True,
    "title": "🔮 周文王占卜系统 - 后端API测试工具"
}

# 请求超时配置(秒)
TIMEOUT_CONFIG = {
    "health_check": 10,
    "api_validation": 15,
    "standard_generation": 60,
    "stream_generation": 120,
    "vision_analysis": 90,
}

# 日志配置
LOG_CONFIG = {
    "show_timestamps": True,
    "log_level": "INFO",  # DEBUG, INFO, WARN, ERROR
    "max_log_lines": 100,
} 