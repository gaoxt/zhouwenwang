#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔮 周文王占卜系统 - Gradio后端测试客户端

这个工具用于测试后端服务的各种API功能，包括：
- 健康检查
- API密钥验证  
- 流式文本生成
- 标准文本生成
- 视觉分析

作者: AI助手
版本: 1.0.0
"""

import gradio as gr
import requests
import json
import time
import base64
from io import BytesIO
from PIL import Image
import sseclient
from typing import Optional, Dict, Any, Generator
import threading
from datetime import datetime

class BackendTester:
    def __init__(self, base_url: str = "http://localhost:3001"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.timeout = 30
        
    def log_message(self, message: str, level: str = "INFO") -> str:
        """生成带时间戳的日志消息"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        return f"[{timestamp}] {level}: {message}"
    
    def test_health_check(self) -> tuple[str, str]:
        """测试健康检查API"""
        try:
            response = self.session.get(f"{self.base_url}/api/health")
            response.raise_for_status()
            
            data = response.json()
            
            result = f"""✅ 健康检查成功！
            
📊 服务状态信息:
• 状态: {data.get('status', 'unknown')}
• 时间: {data.get('timestamp', 'N/A')}
• 运行时间: {data.get('uptime', 'N/A')}
• API配置: {'✅ 已配置' if data.get('apiConfigured') else '❌ 未配置'}
• 版本: {data.get('version', 'N/A')}
• 活跃连接: {data.get('activeConnections', 'N/A')}/{data.get('maxConnections', 'N/A')}
"""
            
            log = self.log_message("健康检查测试通过")
            return result, log
            
        except requests.exceptions.ConnectionError:
            error_msg = f"❌ 连接失败！请确保后端服务运行在 {self.base_url}"
            log = self.log_message(f"健康检查失败: 无法连接到 {self.base_url}", "ERROR")
            return error_msg, log
            
        except Exception as e:
            error_msg = f"❌ 健康检查失败: {str(e)}"
            log = self.log_message(f"健康检查异常: {str(e)}", "ERROR")
            return error_msg, log
    
    def test_api_validation(self) -> tuple[str, str]:
        """测试API密钥验证"""
        try:
            response = self.session.get(f"{self.base_url}/api/validate")
            
            if response.status_code == 200:
                data = response.json()
                result = f"""✅ API密钥验证成功！
                
🔐 验证结果:
• 密钥有效性: {'✅ 有效' if data.get('valid') else '❌ 无效'}
• 配置状态: {'✅ 已配置' if data.get('configured') else '❌ 未配置'}
• 可用模型数量: {data.get('models', 0)}个
• 验证消息: {data.get('message', 'N/A')}
"""
                log = self.log_message("API密钥验证成功")
                
            else:
                data = response.json()
                result = f"""❌ API密钥验证失败！
                
🔐 验证结果:
• 密钥有效性: {'✅ 有效' if data.get('valid') else '❌ 无效'}  
• 配置状态: {'✅ 已配置' if data.get('configured') else '❌ 未配置'}
• 错误消息: {data.get('message', 'N/A')}

💡 请检查后端服务的环境变量中是否正确设置了 GEMINI_API_KEY
"""
                log = self.log_message(f"API密钥验证失败: {data.get('message', 'N/A')}", "WARN")
                
            return result, log
            
        except Exception as e:
            error_msg = f"❌ API验证请求失败: {str(e)}"
            log = self.log_message(f"API验证异常: {str(e)}", "ERROR")
            return error_msg, log
    
    def test_standard_generation(self, question: str) -> tuple[str, str]:
        """测试标准文本生成API"""
        if not question.strip():
            return "❌ 请输入测试问题", self.log_message("标准生成测试: 问题为空", "WARN")
        
        try:
            payload = {
                "contents": [
                    {
                        "parts": [{"text": question}]
                    }
                ]
            }
            
            # 🔍 记录请求参数详情
            print(f"\n🚀 [请求详情] 标准文本生成API")
            print(f"📍 请求URL: {self.base_url}/api/gemini/generate")
            print(f"📋 请求头: {{'Content-Type': 'application/json'}}")
            print(f"📦 请求体 (JSON):")
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            print(f"📝 问题长度: {len(question)} 字符")
            print(f"⏰ 发送时间: {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
            
            start_time = time.time()
            response = self.session.post(
                f"{self.base_url}/api/gemini/generate",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            end_time = time.time()
            
            # 🔍 记录响应详情
            print(f"\n📥 [响应详情] 标准文本生成API")
            print(f"📊 状态码: {response.status_code}")
            print(f"📋 响应头: {dict(response.headers)}")
            print(f"⏱️ 响应时间: {(end_time - start_time) * 1000:.0f}ms")
            print(f"📦 响应体大小: {len(response.content)} 字节")
            
            response.raise_for_status()
            data = response.json()
            
            # 🔍 记录解析后的响应数据
            print(f"🧩 [响应解析] 标准文本生成API")
            print(f"📚 响应数据结构:")
            print(json.dumps(data, ensure_ascii=False, indent=2))
            
            # 提取生成的文本
            if data.get('candidates') and len(data['candidates']) > 0:
                candidate = data['candidates'][0]
                if candidate.get('content') and candidate['content'].get('parts'):
                    generated_text = candidate['content']['parts'][0].get('text', '没有生成内容')
                else:
                    generated_text = "无法解析生成的内容"
            else:
                generated_text = "没有生成候选结果"
            
            duration = (end_time - start_time) * 1000  # 转换为毫秒
            
            result = f"""✅ 标准文本生成成功！
            
📝 生成结果:
{generated_text}

⏱️ 性能信息:
• 响应时间: {duration:.0f}ms
• 生成状态: {'✅ 成功' if generated_text != '没有生成内容' else '❌ 失败'}
"""
            
            log = self.log_message(f"标准生成测试通过，耗时: {duration:.0f}ms")
            return result, log
            
        except requests.exceptions.HTTPError as e:
            # 🔍 记录详细的错误信息
            print(f"\n❌ [错误详情] 标准文本生成API HTTP错误")
            print(f"📊 错误状态码: {e.response.status_code}")
            print(f"📋 错误响应头: {dict(e.response.headers)}")
            print(f"📦 错误响应体:")
            try:
                error_data = e.response.json()
                print(json.dumps(error_data, ensure_ascii=False, indent=2))
            except:
                print(f"原始错误文本: {e.response.text}")
            print(f"🔍 完整错误信息: {str(e)}")
            
            if e.response.status_code == 400:
                error_msg = f"❌ 请求参数错误，请检查输入格式\n详细错误: {e.response.text}"
            elif e.response.status_code == 429:
                error_msg = "❌ API请求频率限制，请稍后重试"
            elif e.response.status_code == 500:
                error_msg = f"❌ 服务器内部错误，可能是API密钥问题\n详细错误: {e.response.text}"
            else:
                error_msg = f"❌ HTTP错误 {e.response.status_code}: {e.response.text}"
                
            log = self.log_message(f"标准生成HTTP错误: {e.response.status_code} - {e.response.text}", "ERROR")
            return error_msg, log
            
        except Exception as e:
            # 🔍 记录标准生成的其他异常信息
            print(f"\n❌ [异常详情] 标准文本生成API异常")
            print(f"🔍 异常类型: {type(e).__name__}")
            print(f"📦 异常信息: {str(e)}")
            print(f"📍 异常位置: {e.__traceback__.tb_frame.f_code.co_filename}:{e.__traceback__.tb_lineno}" if e.__traceback__ else "未知位置")
            
            error_msg = f"❌ 标准生成请求失败: {str(e)}"
            log = self.log_message(f"标准生成异常: {str(e)}", "ERROR")
            return error_msg, log
    
    def test_stream_generation(self, question: str, progress_callback=None) -> Generator[tuple[str, str], None, None]:
        """测试流式文本生成API"""
        if not question.strip():
            yield "❌ 请输入测试问题", self.log_message("流式生成测试: 问题为空", "WARN")
            return
            
        try:
            payload = {
                "prompt": question,
                "maxTokens": 4096
            }
            
            # 🔍 记录流式请求参数详情
            print(f"\n🚀 [请求详情] 流式文本生成API")
            print(f"📍 请求URL: {self.base_url}/api/gemini/stream")
            print(f"📋 请求头: {{'Content-Type': 'application/json'}}")
            print(f"📦 请求体 (JSON):")
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            print(f"📝 问题长度: {len(question)} 字符")
            print(f"⏰ 发送时间: {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
            
            start_time = time.time()
            yield "🚀 正在建立流式连接...", self.log_message("开始流式生成测试")
            
            response = self.session.post(
                f"{self.base_url}/api/gemini/stream",
                json=payload,
                headers={"Content-Type": "application/json"},
                stream=True
            )
            
            # 🔍 记录流式响应初始状态
            print(f"\n📥 [响应详情] 流式文本生成API")
            print(f"📊 状态码: {response.status_code}")
            print(f"📋 响应头: {dict(response.headers)}")
            print(f"🌊 流式连接状态: {'✅ 成功建立' if response.status_code == 200 else '❌ 建立失败'}")
            
            # 设置响应编码为UTF-8，避免乱码
            response.encoding = 'utf-8'
            
            response.raise_for_status()
            
            yield "✅ 流式连接建立成功，等待响应...", self.log_message("流式连接建立成功")
            
            # 使用SSE客户端解析流式数据
            client = sseclient.SSEClient(response)
            accumulated_text = ""
            chunk_count = 0
            
            print(f"🌊 开始处理SSE流式数据...")
            
            for event in client.events():
                chunk_count += 1
                
                # 🔍 记录每个SSE事件的详细信息
                print(f"\n📡 [SSE事件 #{chunk_count}]")
                print(f"🏷️ 事件类型: {event.event if event.event else 'data'}")
                print(f"📦 数据内容: {event.data[:200]}{'...' if len(event.data) > 200 else ''}")
                print(f"🆔 事件ID: {event.id if event.id else 'N/A'}")
                print(f"⏰ 接收时间: {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
                
                # 处理所有类型的SSE事件（不限制事件类型）
                try:
                    data = json.loads(event.data)
                    print(f"✅ JSON解析成功: {json.dumps(data, ensure_ascii=False, indent=2)}")
                    
                    # 检查是否是完成信号
                    if data.get('done') == True:
                        end_time = time.time()
                        total_duration = (end_time - start_time) * 1000
                        
                        final_result = f"""✅ 流式生成完成！

📝 最终生成结果:
{accumulated_text}

📊 完整统计信息:
• 总耗时: {total_duration:.0f}ms
• 数据块数: {chunk_count}
• 平均每块耗时: {total_duration/chunk_count:.0f}ms (如果大于0)
• 生成字数: {len(accumulated_text)}字
• 连接状态: ✅ 已完成"""

                        yield final_result, self.log_message(f"流式生成完成，总耗时: {total_duration:.0f}ms，共{chunk_count}块数据")
                        return
                    
                    # 检查是否有错误
                    if 'error' in data:
                        error_msg = f"❌ 流式生成错误: {data.get('error', '未知错误')}"
                        yield error_msg, self.log_message(f"流式生成错误: {data.get('error')}", "ERROR")
                        return
                    
                    # 处理增量内容
                    if 'content' in data and data['content']:
                        delta_text = data['content']
                        accumulated_text += delta_text  # 累积增量内容
                        current_time = time.time()
                        duration = (current_time - start_time) * 1000
                        
                        display_text = f"""🌊 流式响应进行中... (第{chunk_count}块)

📝 本次增量内容:
{delta_text}

📚 累积生成内容:
{accumulated_text}

⏱️ 实时信息:
• 已用时间: {duration:.0f}ms
• 数据块数: {chunk_count}
• 累积字数: {len(accumulated_text)}字
• 连接状态: ✅ 正常"""

                        yield display_text, self.log_message(f"接收到第{chunk_count}块增量数据: {len(delta_text)}字符")
                    
                    # 兼容旧格式：累积内容
                    elif 'text' in data:
                        accumulated_text = data['text']
                        current_time = time.time()
                        duration = (current_time - start_time) * 1000
                        
                        display_text = f"""🌊 流式响应进行中... (第{chunk_count}块数据)

📝 当前生成内容:
{accumulated_text}

⏱️ 实时信息:
• 已用时间: {duration:.0f}ms
• 数据块数: {chunk_count}
• 连接状态: ✅ 正常"""

                        yield display_text, self.log_message(f"接收到第{chunk_count}块流式数据")
                        
                except json.JSONDecodeError as json_err:
                    print(f"❌ JSON解析失败: {str(json_err)}")
                    print(f"📦 原始数据: {event.data}")
                    continue
                    
        except requests.exceptions.HTTPError as e:
            # 🔍 记录流式生成的详细错误信息
            print(f"\n❌ [错误详情] 流式文本生成API HTTP错误")
            print(f"📊 错误状态码: {e.response.status_code}")
            print(f"📋 错误响应头: {dict(e.response.headers)}")
            print(f"📦 错误响应体:")
            try:
                error_data = e.response.json()
                print(json.dumps(error_data, ensure_ascii=False, indent=2))
            except:
                print(f"原始错误文本: {e.response.text}")
            print(f"🔍 完整错误信息: {str(e)}")
            
            if e.response.status_code == 400:
                error_msg = f"❌ 请求参数错误，请检查输入格式\n详细错误: {e.response.text}"
            elif e.response.status_code == 429:
                error_msg = "❌ API请求频率限制，请稍后重试"  
            elif e.response.status_code == 503:
                error_msg = "❌ 服务器繁忙，请稍后重试"
            else:
                error_msg = f"❌ HTTP错误 {e.response.status_code}: {e.response.text}"
                
            yield error_msg, self.log_message(f"流式生成HTTP错误: {e.response.status_code} - {e.response.text}", "ERROR")
            
        except Exception as e:
            # 🔍 记录流式生成的其他异常信息
            print(f"\n❌ [异常详情] 流式文本生成API异常")
            print(f"🔍 异常类型: {type(e).__name__}")
            print(f"📦 异常信息: {str(e)}")
            print(f"📍 异常位置: {e.__traceback__.tb_frame.f_code.co_filename}:{e.__traceback__.tb_lineno}" if e.__traceback__ else "未知位置")
            
            error_msg = f"❌ 流式生成请求失败: {str(e)}"
            yield error_msg, self.log_message(f"流式生成异常: {str(e)}", "ERROR")
    
    def test_vision_analysis(self, image, question: str) -> tuple[str, str]:
        """测试视觉分析API"""
        if image is None:
            return "❌ 请上传图片", self.log_message("视觉分析测试: 图片为空", "WARN")
            
        if not question.strip():
            question = "请详细分析这张图片"
            
        try:
            # 将PIL图像转换为base64
            buffer = BytesIO()
            if image.mode != 'RGB':
                image = image.convert('RGB')
            image.save(buffer, format='JPEG')
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": question},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": image_base64
                                }
                            }
                        ]
                    }
                ]
            }
            
            # 🔍 记录视觉分析请求参数详情
            print(f"\n🚀 [请求详情] 视觉分析API")
            print(f"📍 请求URL: {self.base_url}/api/gemini/vision")
            print(f"📋 请求头: {{'Content-Type': 'application/json'}}")
            print(f"📦 请求体结构:")
            payload_summary = {
                "contents": [
                    {
                        "parts": [
                            {"text": question},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": f"[BASE64图片数据: {len(image_base64)} 字符]"
                                }
                            }
                        ]
                    }
                ]
            }
            print(json.dumps(payload_summary, ensure_ascii=False, indent=2))
            print(f"🖼️ 图片信息: 尺寸{image.size}, 模式{image.mode}")
            print(f"📝 问题长度: {len(question)} 字符")
            print(f"📦 Base64数据长度: {len(image_base64)} 字符")
            print(f"⏰ 发送时间: {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
            
            start_time = time.time()
            response = self.session.post(
                f"{self.base_url}/api/gemini/vision",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            end_time = time.time()
            
            # 🔍 记录视觉分析响应详情
            print(f"\n📥 [响应详情] 视觉分析API")
            print(f"📊 状态码: {response.status_code}")
            print(f"📋 响应头: {dict(response.headers)}")
            print(f"⏱️ 响应时间: {(end_time - start_time) * 1000:.0f}ms")
            print(f"📦 响应体大小: {len(response.content)} 字节")
            
            response.raise_for_status()
            data = response.json()
            
            # 🔍 记录解析后的响应数据
            print(f"🧩 [响应解析] 视觉分析API")
            print(f"📚 响应数据结构:")
            print(json.dumps(data, ensure_ascii=False, indent=2))
            
            # 提取分析结果
            if data.get('candidates') and len(data['candidates']) > 0:
                candidate = data['candidates'][0]
                if candidate.get('content') and candidate['content'].get('parts'):
                    analysis_text = candidate['content']['parts'][0].get('text', '没有分析结果')
                else:
                    analysis_text = "无法解析分析结果"
            else:
                analysis_text = "没有生成分析结果"
            
            duration = (end_time - start_time) * 1000
            
            result = f"""✅ 视觉分析成功！
            
🖼️ 图片分析结果:
{analysis_text}

⏱️ 性能信息:
• 响应时间: {duration:.0f}ms
• 图片尺寸: {image.size}
• 分析状态: {'✅ 成功' if analysis_text != '没有分析结果' else '❌ 失败'}
"""
            
            log = self.log_message(f"视觉分析测试通过，耗时: {duration:.0f}ms")
            return result, log
            
        except requests.exceptions.HTTPError as e:
            # 🔍 记录视觉分析的详细错误信息
            print(f"\n❌ [错误详情] 视觉分析API HTTP错误")
            print(f"📊 错误状态码: {e.response.status_code}")
            print(f"📋 错误响应头: {dict(e.response.headers)}")
            print(f"📦 错误响应体:")
            try:
                error_data = e.response.json()
                print(json.dumps(error_data, ensure_ascii=False, indent=2))
            except:
                print(f"原始错误文本: {e.response.text}")
            print(f"🔍 完整错误信息: {str(e)}")
            
            if e.response.status_code == 400:
                error_msg = f"❌ 请求参数错误，请检查输入格式\n详细错误: {e.response.text}"
            elif e.response.status_code == 413:
                error_msg = "❌ 图片文件过大，请上传较小的图片"
            elif e.response.status_code == 429:
                error_msg = "❌ API请求频率限制，请稍后重试"
            elif e.response.status_code == 500:
                error_msg = f"❌ 服务器内部错误，可能是API密钥问题\n详细错误: {e.response.text}"
            else:
                error_msg = f"❌ HTTP错误 {e.response.status_code}: {e.response.text}"
                
            log = self.log_message(f"视觉分析HTTP错误: {e.response.status_code} - {e.response.text}", "ERROR")
            return error_msg, log
            
        except Exception as e:
            # 🔍 记录其他异常的详细信息
            print(f"\n❌ [异常详情] 视觉分析API异常")
            print(f"🔍 异常类型: {type(e).__name__}")
            print(f"📦 异常信息: {str(e)}")
            print(f"📍 异常位置: {e.__traceback__.tb_frame.f_code.co_filename}:{e.__traceback__.tb_lineno}" if e.__traceback__ else "未知位置")
            
            error_msg = f"❌ 视觉分析失败: {str(e)}"
            log = self.log_message(f"视觉分析异常: {str(e)}", "ERROR")
            return error_msg, log

    def test_vision_stream_analysis(self, image, question: str) -> Generator[tuple[str, str], None, None]:
        """测试流式视觉分析API"""
        if image is None:
            yield "❌ 请上传图片", self.log_message("流式视觉分析测试: 图片为空", "WARN")
            return
            
        if not question.strip():
            question = "请详细分析这张图片"
            
        try:
            # 将PIL图像转换为base64
            buffer = BytesIO()
            if image.mode != 'RGB':
                image = image.convert('RGB')
            image.save(buffer, format='JPEG')
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": question},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": image_base64
                                }
                            }
                        ]
                    }
                ]
            }
            
            # 🔍 记录流式视觉分析请求参数详情
            print(f"\n🚀 [请求详情] 流式视觉分析API")
            print(f"📍 请求URL: {self.base_url}/api/gemini/vision-stream")
            print(f"📋 请求头: {{'Content-Type': 'application/json'}}")
            print(f"📦 请求体结构:")
            payload_summary = {
                "contents": [
                    {
                        "parts": [
                            {"text": question},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": f"[BASE64图片数据: {len(image_base64)} 字符]"
                                }
                            }
                        ]
                    }
                ]
            }
            print(json.dumps(payload_summary, ensure_ascii=False, indent=2))
            print(f"🖼️ 图片信息: 尺寸{image.size}, 模式{image.mode}")
            print(f"📝 问题长度: {len(question)} 字符")
            print(f"📦 Base64数据长度: {len(image_base64)} 字符")
            print(f"⏰ 发送时间: {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
            
            start_time = time.time()
            yield "🚀 正在建立流式视觉分析连接...", self.log_message("开始流式视觉分析测试")
            
            response = self.session.post(
                f"{self.base_url}/api/gemini/vision-stream",
                json=payload,
                headers={"Content-Type": "application/json"},
                stream=True
            )
            
            # 🔍 记录流式视觉分析响应初始状态
            print(f"\n📥 [响应详情] 流式视觉分析API")
            print(f"📊 状态码: {response.status_code}")
            print(f"📋 响应头: {dict(response.headers)}")
            print(f"🌊 流式连接状态: {'✅ 成功建立' if response.status_code == 200 else '❌ 建立失败'}")
            
            # 设置响应编码为UTF-8，避免乱码
            response.encoding = 'utf-8'
            
            response.raise_for_status()
            
            yield "✅ 流式视觉分析连接建立成功，等待响应...", self.log_message("流式视觉分析连接建立成功")
            
            # 使用SSE客户端解析流式数据
            client = sseclient.SSEClient(response)
            accumulated_text = ""
            chunk_count = 0
            
            print(f"🌊 开始处理SSE流式视觉分析数据...")
            
            for event in client.events():
                chunk_count += 1
                
                # 🔍 记录每个SSE事件的详细信息
                print(f"\n📡 [SSE事件 #{chunk_count}] 视觉分析")
                print(f"🏷️ 事件类型: {event.event if event.event else 'data'}")
                print(f"📦 数据内容: {event.data[:200]}{'...' if len(event.data) > 200 else ''}")
                print(f"🆔 事件ID: {event.id if event.id else 'N/A'}")
                print(f"⏰ 接收时间: {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
                
                # 处理所有类型的SSE事件（不限制事件类型）
                try:
                    data = json.loads(event.data)
                    print(f"✅ JSON解析成功: {json.dumps(data, ensure_ascii=False, indent=2)}")
                    
                    # 检查是否是完成信号
                    if data.get('finishReason') or data.get('status') == 'completed':
                        end_time = time.time()
                        total_duration = (end_time - start_time) * 1000
                        
                        final_result = f"""✅ 流式视觉分析完成！

🖼️ 最终分析结果:
{accumulated_text}

📊 完整统计信息:
• 总耗时: {total_duration:.0f}ms
• 数据块数: {chunk_count}
• 完成原因: {data.get('finishReason', '正常完成')}
• 分析字数: {len(accumulated_text)}字
• 连接状态: ✅ 已完成"""

                        yield final_result, self.log_message(f"流式视觉分析完成，总耗时: {total_duration:.0f}ms，共{chunk_count}块数据")
                        return
                    
                    # 检查是否有错误
                    if 'error' in data:
                        error_msg = f"❌ 流式视觉分析错误: {data.get('error', '未知错误')}"
                        yield error_msg, self.log_message(f"流式视觉分析错误: {data.get('error')}", "ERROR")
                        return
                    
                    # 处理视觉分析的增量文本内容
                    if 'text' in data:
                        delta_text = data['text']
                        accumulated_text += delta_text  # 🔧 累积增量内容，不是替换
                        current_time = time.time()
                        duration = (current_time - start_time) * 1000
                        
                        display_text = f"""🌊 流式视觉分析进行中... (第{chunk_count}块)

📝 本次增量内容:
{delta_text}

🖼️ 累积分析内容:
{accumulated_text}

⏱️ 实时信息:
• 已用时间: {duration:.0f}ms
• 数据块数: {chunk_count}
• 累积字数: {len(accumulated_text)}字
• 连接状态: ✅ 正常"""

                        yield display_text, self.log_message(f"接收到第{chunk_count}块视觉分析增量数据: {len(delta_text)}字符")
                    
                    # 处理最终文本内容
                    elif 'finalText' in data:
                        # 🔧 确保最终文本被正确处理（通常是最后一个增量片段）
                        final_delta = data['finalText']
                        if final_delta and final_delta not in accumulated_text:
                            accumulated_text += final_delta
                        
                        current_time = time.time()
                        duration = (current_time - start_time) * 1000
                        
                        display_text = f"""🌊 流式视觉分析即将完成...

📝 最终增量内容:
{final_delta}

🖼️ 完整分析内容:
{accumulated_text}

⏱️ 实时信息:
• 已用时间: {duration:.0f}ms
• 数据块数: {chunk_count}
• 最终字数: {len(accumulated_text)}字
• 连接状态: ✅ 接近完成"""

                        yield display_text, self.log_message(f"接收到视觉分析最终增量: {len(final_delta) if final_delta else 0}字符")
                        
                except json.JSONDecodeError as json_err:
                    print(f"❌ JSON解析失败: {str(json_err)}")
                    print(f"📦 原始数据: {event.data}")
                    continue
                    
        except requests.exceptions.HTTPError as e:
            # 🔍 记录流式视觉分析的详细错误信息
            print(f"\n❌ [错误详情] 流式视觉分析API HTTP错误")
            print(f"📊 错误状态码: {e.response.status_code}")
            print(f"📋 错误响应头: {dict(e.response.headers)}")
            print(f"📦 错误响应体:")
            try:
                error_data = e.response.json()
                print(json.dumps(error_data, ensure_ascii=False, indent=2))
            except:
                print(f"原始错误文本: {e.response.text}")
            print(f"🔍 完整错误信息: {str(e)}")
            
            if e.response.status_code == 400:
                error_msg = f"❌ 请求参数错误，请检查输入格式\n详细错误: {e.response.text}"
            elif e.response.status_code == 413:
                error_msg = "❌ 图片文件过大，请上传较小的图片"
            elif e.response.status_code == 429:
                error_msg = "❌ API请求频率限制，请稍后重试"
            elif e.response.status_code == 500:
                error_msg = f"❌ 服务器内部错误，可能是API密钥问题\n详细错误: {e.response.text}"
            else:
                error_msg = f"❌ HTTP错误 {e.response.status_code}: {e.response.text}"
                
            yield error_msg, self.log_message(f"流式视觉分析HTTP错误: {e.response.status_code} - {e.response.text}", "ERROR")
            
        except Exception as e:
            # 🔍 记录流式视觉分析的其他异常信息
            print(f"\n❌ [异常详情] 流式视觉分析API异常")
            print(f"🔍 异常类型: {type(e).__name__}")
            print(f"📦 异常信息: {str(e)}")
            print(f"📍 异常位置: {e.__traceback__.tb_frame.f_code.co_filename}:{e.__traceback__.tb_lineno}" if e.__traceback__ else "未知位置")
            
            error_msg = f"❌ 流式视觉分析请求失败: {str(e)}"
            yield error_msg, self.log_message(f"流式视觉分析异常: {str(e)}", "ERROR")

# 全局测试器实例
tester = BackendTester()

def create_interface():
    """创建Gradio界面"""
    
    with gr.Blocks(
        title="🔮 周文王占卜系统 - 后端API测试工具",
        theme=gr.themes.Soft(),
        css="""
        .gradio-container {
            max-width: 1200px !important;
        }
        .test-header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .status-box {
            background: #f8f9fa;
            border-left: 4px solid #5a67d8;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
        }
        .success {
            border-left-color: #28a745;
            background: #d4edda;
        }
        .error {
            border-left-color: #dc3545;
            background: #f8d7da;
        }
        """
    ) as demo:
        
        # 标题区域
        gr.Markdown("""
        <div class="test-header">
            <h1>🔮 周文王占卜系统</h1>
            <h2>后端API功能测试工具</h2>
            <p>测试后端服务的健康状态、API功能和流式响应能力</p>
        </div>
        """)
        
        # 服务器配置
        with gr.Row():
            with gr.Column(scale=2):
                server_url = gr.Textbox(
                    label="🌐 后端服务地址",
                    value="http://localhost:3001",
                    placeholder="输入后端服务的完整URL",
                    info="默认连接到本地后端服务"
                )
            with gr.Column(scale=1):
                update_url_btn = gr.Button("🔄 更新连接", variant="secondary")
        
        # 更新服务器地址的函数
        def update_server_url(url):
            global tester
            tester = BackendTester(url)
            return f"✅ 已更新后端地址为: {url}"
        
        update_url_btn.click(
            update_server_url,
            inputs=[server_url],
            outputs=[gr.Textbox(label="更新状态", interactive=False)]
        )
        
        # 主要测试区域
        with gr.Tabs():
            
            # Tab 1: 基础检查
            with gr.TabItem("🏥 基础检查"):
                gr.Markdown("### 测试后端服务的基础功能")
                
                with gr.Row():
                    health_btn = gr.Button("🔍 健康检查", variant="primary")
                    validate_btn = gr.Button("🔐 API密钥验证", variant="secondary")
                
                basic_result = gr.Textbox(
                    label="📊 检查结果", 
                    lines=10,
                    interactive=False
                )
                basic_log = gr.Textbox(
                    label="📋 操作日志",
                    lines=3,
                    interactive=False
                )
                
                health_btn.click(
                    tester.test_health_check,
                    outputs=[basic_result, basic_log]
                )
                
                validate_btn.click(
                    tester.test_api_validation,
                    outputs=[basic_result, basic_log]
                )
            
            # Tab 2: 标准文本生成
            with gr.TabItem("📝 标准生成"):
                gr.Markdown("### 测试标准的文本生成API")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        standard_question = gr.Textbox(
                            label="💭 测试问题",
                            value="请用六爻占卜为我预测今日运势，要求回答控制在800字以内，包含起卦过程、卦象分析、爻辞解读和运势预测",
                            lines=3,
                            placeholder="输入要测试的问题..."
                        )
                    with gr.Column(scale=1):
                        standard_btn = gr.Button("🚀 开始测试", variant="primary", size="lg")
                
                standard_result = gr.Textbox(
                    label="📝 生成结果",
                    lines=12,
                    interactive=False
                )
                standard_log = gr.Textbox(
                    label="📋 操作日志",
                    lines=3,
                    interactive=False
                )
                
                standard_btn.click(
                    tester.test_standard_generation,
                    inputs=[standard_question],
                    outputs=[standard_result, standard_log]
                )
            
            # Tab 3: 流式文本生成
            with gr.TabItem("🌊 流式生成"):
                gr.Markdown("### 测试Server-Sent Events流式文本生成")
                
                with gr.Row():
                    with gr.Column(scale=3):
                        stream_question = gr.Textbox(
                            label="💭 测试问题",
                            value="请详细解释六爻占卜的起卦方法和卦象解读，要求回答控制在800字以内，包含历史渊源、具体步骤、卦象含义和实际应用",
                            lines=3,
                            placeholder="输入要测试的问题..."
                        )
                    with gr.Column(scale=1):
                        stream_btn = gr.Button("🌊 开始流式测试", variant="primary", size="lg")
                
                stream_result = gr.Textbox(
                    label="🌊 流式响应结果",
                    lines=15,
                    interactive=False
                )
                stream_log = gr.Textbox(
                    label="📋 操作日志",
                    lines=3,
                    interactive=False
                )
                
                # 流式测试的特殊处理
                def start_stream_test(question):
                    """启动流式测试，逐步更新界面"""
                    for result, log in tester.test_stream_generation(question):
                        yield result, log
                
                stream_btn.click(
                    start_stream_test,
                    inputs=[stream_question],
                    outputs=[stream_result, stream_log]
                )
            
            # Tab 4: 视觉分析
            with gr.TabItem("🖼️ 视觉分析"):
                gr.Markdown("### 测试图片分析API（手相分析等）")
                
                with gr.Row():
                    with gr.Column():
                        vision_image = gr.Image(
                            label="📷 上传测试图片",
                            type="pil",
                            height=300
                        )
                        vision_question = gr.Textbox(
                            label="💭 分析问题",
                            value="请分析这张手相图片，解读手纹含义，要求回答控制在800字以内，包含主要手纹分析、性格特征、运势预测和建议",
                            lines=2,
                            placeholder="输入对图片的分析要求..."
                        )
                        
                        # 分析方式选择
                        with gr.Row():
                            vision_btn = gr.Button("🔍 标准分析", variant="primary")
                            vision_stream_btn = gr.Button("🌊 流式分析", variant="secondary")
                    
                    with gr.Column():
                        vision_result = gr.Textbox(
                            label="🖼️ 视觉分析结果",
                            lines=15,
                            interactive=False
                        )
                
                vision_log = gr.Textbox(
                    label="📋 操作日志",
                    lines=3,
                    interactive=False
                )
                
                # 标准视觉分析
                vision_btn.click(
                    tester.test_vision_analysis,
                    inputs=[vision_image, vision_question],
                    outputs=[vision_result, vision_log]
                )
                
                # 流式视觉分析
                def start_vision_stream_test(image, question):
                    """启动流式视觉分析测试，逐步更新界面"""
                    for result, log in tester.test_vision_stream_analysis(image, question):
                        yield result, log
                
                vision_stream_btn.click(
                    start_vision_stream_test,
                    inputs=[vision_image, vision_question],
                    outputs=[vision_result, vision_log]
                )
        
        # 底部信息
        gr.Markdown("""
        ---
        ### 📘 使用说明
        
        1. **基础检查**: 确保后端服务正常运行，API密钥配置正确
        2. **标准生成**: 测试传统的请求-响应模式文本生成
        3. **流式生成**: 测试实时流式响应，观察数据流传输
        4. **视觉分析**: 测试图片上传和AI视觉分析功能
           - **🔍 标准分析**: 传统的请求-响应模式，一次性返回完整结果
           - **🌊 流式分析**: 实时流式响应，逐步显示分析过程
        
        ### 🔧 故障排除
        
        - 如果连接失败，请检查后端服务是否启动在指定端口
        - 如果API密钥验证失败，请检查后端的环境变量配置
        - 如果生成失败，可能是API配额或网络问题
        - 如果流式分析没有响应，请检查后端流式端点是否正常工作
        """)
    
    return demo

if __name__ == "__main__":
    print("🔮 启动周文王占卜系统后端测试工具...")
    print("📡 默认连接地址: http://localhost:3001")
    print("🔍 详细请求/响应日志已启用 - 可在控制台查看完整调试信息")
    print("🆕 新增功能: 流式视觉分析 - 实时显示图片分析过程")
    print("🌐 Gradio界面即将在浏览器中打开...")
    
    demo = create_interface()
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        inbrowser=True,
        show_error=True
    ) 