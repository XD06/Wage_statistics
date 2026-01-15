import { AppState } from '../types';

export interface WebDAVConfig {
  enabled: boolean;
  url: string;
  username?: string;
  password?: string;
  filename?: string;
}

const DEFAULT_FILENAME = 'weekly_keeper_data.json';

// Helper to handle UTF-8 strings in Base64
const utf8_to_b64 = (str: string) => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

const getHeaders = (config: WebDAVConfig) => {
  const auth = utf8_to_b64(`${config.username || ''}:${config.password || ''}`);
  return {
    'Authorization': `Basic ${auth}`,
    // 极简模式：不发送 Content-Type，让浏览器自动处理，减少预检复杂度
  };
};

const getFullUrl = (config: WebDAVConfig) => {
  let url = config.url.trim();
  if (!url) throw new Error("WebDAV URL is empty");
  
  // Mixed Content Check
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.toLowerCase().startsWith('http:')) {
      throw new Error("安全策略限制：HTTPS 网页无法访问 HTTP 资源。请使用 https:// 开头的 WebDAV 地址。");
  }

  if (!url.endsWith('/')) url += '/';
  const filename = config.filename || DEFAULT_FILENAME;
  return url + filename;
};

export const uploadToWebDAV = async (data: AppState, config: WebDAVConfig): Promise<boolean> => {
  if (!config.enabled || !config.url) return false;

  try {
    const url = getFullUrl(config);
    // 纯净请求配置
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(config),
      body: JSON.stringify(data),
      mode: 'cors', 
      credentials: 'omit', // 不发送 Cookie，防止干扰
      referrerPolicy: 'no-referrer', // 不发送来源信息，防止防火墙拦截
      keepalive: true, // 保持连接
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      console.log('WebDAV Upload Successful');
      return true;
    } else {
      throw new Error(`状态码: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    console.error('WebDAV Error:', error);
    // 给用户的最终解释
    const msg = error.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
       throw new Error('网络连接中断。\n\n这是浏览器拦截了请求，通常是因为服务器 Nginx 配置拒绝了跨域(CORS)，或者 HTTP2 协议出现了兼容性问题。\n\n请尝试修改 Nginx 配置去掉 http2 尝试。');
    }
    throw error;
  }
};

export const downloadFromWebDAV = async (config: WebDAVConfig): Promise<AppState | null> => {
  if (!config.url) throw new Error("Missing URL");

  try {
    const url = getFullUrl(config);
    const fetchUrl = `${url}?t=${new Date().getTime()}`; // 防缓存
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: getHeaders(config),
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });

    if (response.ok) {
      return await response.json() as AppState;
    } else if (response.status === 404) {
      return null;
    } else {
      throw new Error(`下载失败: ${response.status}`);
    }
  } catch (error: any) {
    console.error('WebDAV Download Error:', error);
    const msg = error.message || '';
    if (msg.includes('Failed to fetch')) {
        throw new Error('网络连接中断 (CORS/HTTP2)。请检查 Nginx 配置。');
    }
    throw error;
  }
};