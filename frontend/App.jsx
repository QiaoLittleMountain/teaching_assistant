import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import './App.css'
import { sendChatMessage } from './api/chat'
import logoImg from './assets/logo.png'

// ---------- 场景与图标配置 ----------
const SCENE_OPTIONS = [
  { key: 'night', label: { en: 'Starry Night', zh: '星空黑夜' }, angle: 0 },
  { key: 'day', label: { en: 'Blue Sky', zh: '碧水蓝天' }, angle: 120 },
  { key: 'sunset', label: { en: 'Sunset', zh: '落日余晖' }, angle: 240 },
]

const LineIcon = ({ type }) => {
  if (type === 'day') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="line-icon">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
  if (type === 'sunset') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="line-icon">
      <path d="M17 18a5 5 0 0 0-10 0M2 18h20M2 22h20M8 22h8" />
      <path d="M12 2v3M4.93 4.93l1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="line-icon">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

// ---------- 多语言文本 ----------
const TRANSLATIONS = {
  en: {
    brand: 'Discrete Tutor',
    settings: 'Settings',
    login: 'Login',
    signup: 'Sign up',
    studentTitle: 'Discrete Math Tutor',
    placeholder: 'Ask your discrete math question...',
    send: 'Send',
    sending: '...',
    teacherTitle: 'Teacher Dashboard',
    uploadTitle: 'Upload Teaching Materials',
    selectFile: 'Select file',
    chooseType: 'Resource type',
    uploadButton: 'Upload',
    uploading: 'Uploading...',
    resourcesTitle: 'Learning Resources',
    download: 'Download',
    delete: 'Delete',
    noFiles: 'No resources yet.',
    fileSize: 'KB',
    language: 'Language',
    currentScene: 'Current scene',
    scrollDown: 'Scroll down for resources',
    switchRole: 'Switch to Teacher',
    switchRoleStudent: 'Switch to Student',
    attachFile: 'Attach file/image',
    removing: 'Remove',
    filters: {
      All: 'All',
      Slides: 'Slides',
      Notes: 'Notes',
      Practice: 'Practice',
      Books: 'Books'
    },
    auth: {
      loginTitle: 'Welcome Back',
      signupTitle: 'Create Account',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      loginBtn: 'Login',
      signupBtn: 'Sign up',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      backToHome: 'Back to Home'
    }
  },
  zh: {
    brand: '离散数学助教',
    settings: '设置',
    login: '登录',
    signup: '注册',
    studentTitle: '离散数学助教',
    placeholder: '输入你的离散数学问题...',
    send: '发送',
    sending: '...',
    teacherTitle: '教师工作台',
    uploadTitle: '上传教学资料',
    selectFile: '选择文件',
    chooseType: '资源类型',
    uploadButton: '上传',
    uploading: '上传中...',
    resourcesTitle: '学习资源',
    download: '下载',
    delete: '删除',
    noFiles: '暂无资源',
    fileSize: 'KB',
    language: '语言',
    currentScene: '当前场景',
    scrollDown: '向下滑动查看资源',
    switchRole: '切换到教师',
    switchRoleStudent: '切换到学生',
    attachFile: '上传文件/图片',
    removing: '移除',
    filters: {
      All: '全部',
      Slides: '课件',
      Notes: '笔记',
      Practice: '练习',
      Books: '书籍'
    },
    auth: {
      loginTitle: '欢迎回来',
      signupTitle: '创建账号',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      loginBtn: '登录',
      signupBtn: '注册',
      noAccount: '还没有账号？',
      hasAccount: '已有账号？',
      backToHome: '返回首页'
    }
  }
}

const SCENE_QUOTES = {
  day: {
    en: { text: 'All of mathematics... finds the most secret truths and puts them in the right light.', author: 'Leonhard Euler' },
    zh: { text: '所有的数学……都能发现最隐秘的真理，并将其置于正确的光线下。', author: '欧拉' }
  },
  night: {
    en: { text: 'There are faint stars in the night sky that you can see, but only if you look to the side of where they shine... Maybe truth is just like that.', author: 'Kurt Godel' },
    zh: { text: '夜空中有些微弱的星光，只有当你侧过头去看它们时才能看见……也许真理也是如此。', author: '哥德尔' }
  },
  sunset: {
    en: { text: 'Thought is only a flash between two long nights, but this flash is everything.', author: 'Henri Poincare' },
    zh: { text: '思想只是两次漫漫长夜之间的一道闪电，但这道闪电就是一切。', author: '亨利·庞加莱' }
  },
}

const RESOURCE_TYPES = ['Slides', 'Notes', 'Practice', 'Books']

function getBeijingHour() {
  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date()).find((part) => part.type === 'hour')
  return Number(hourPart?.value ?? 0)
}

function getSceneByHour(hour) {
  if (hour >= 6 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'sunset'
  return 'night'
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

// 资源网格组件
const ResourceGrid = ({ resources, activeFilter, onFilterChange, t, role, onDownload, onDelete }) => {
  const filtered = activeFilter === 'All' ? resources : resources.filter(r => r.type === activeFilter)

  return (
    <div className="resources-container">
      <div className="resources-header">
        <h2>{t.resourcesTitle}</h2>
        <div className="filter-bar">
          {['All', ...RESOURCE_TYPES].map(f => (
            <button key={f} className={`filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => onFilterChange(f)}>
              {t.filters[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="resources-grid">
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px' }}>
            {t.noFiles}
          </div>
        ) : (
          filtered.map(res => (
            <div key={res.id} className="resource-card">
              <div className="card-type">{t.filters[res.type]}</div>
              <h3>{res.name}</h3>
              <p style={{ fontSize: '12px', opacity: 0.6 }}>{res.sizeKB} {t.fileSize} • {res.uploadDate}</p>
              <div className="card-footer">
                <button className="download-btn" onClick={() => onDownload(res)}>{t.download}</button>
                {role === 'teacher' && (
                  <button className="download-btn" onClick={() => onDelete(res.id)} style={{ background: 'rgba(255,80,80,0.2)' }}>{t.delete}</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ---------- 主应用 ----------
function App() {
  const [role, setRole] = useState('student')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [authModal, setAuthModal] = useState(null)
  const [language, setLanguage] = useState('en')
  const [activeFilter, setActiveFilter] = useState('All')
  const [scrollPos, setScrollPos] = useState(0)
  const [dialRotation, setDialRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startRot: 0 })
  const containerRef = useRef(null)
  const t = TRANSLATIONS[language]

  // 学生端聊天状态
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  // 新增：待上传的文件
  const [attachedFile, setAttachedFile] = useState(null)

  // 教师端上传状态
  const [uploadType, setUploadType] = useState('Slides')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // 共享资源数据
  const [resources, setResources] = useState(() => [
    { id: 'demo1', name: 'Week1_Slides.pdf', type: 'Slides', sizeKB: 245, dataURL: null, uploadDate: new Date().toLocaleDateString() },
    { id: 'demo2', name: 'Predicate_Logic_Notes.pdf', type: 'Notes', sizeKB: 189, dataURL: null, uploadDate: new Date().toLocaleDateString() },
    { id: 'demo3', name: 'Proof_Practice.pdf', type: 'Practice', sizeKB: 412, dataURL: null, uploadDate: new Date().toLocaleDateString() },
    { id: 'demo4', name: 'Rosen_Textbook_Excerpt.pdf', type: 'Books', sizeKB: 1250, dataURL: null, uploadDate: new Date().toLocaleDateString() },
  ])

  // ---------- 场景旋钮逻辑 ----------
  useEffect(() => {
    const currentSceneKey = getSceneByHour(getBeijingHour())
    const targetScene = SCENE_OPTIONS.find(s => s.key === currentSceneKey)
    if (targetScene) setDialRotation(-targetScene.angle)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const pos = containerRef.current.scrollTop / window.innerHeight
        setScrollPos(pos)
      }
    }
    const container = containerRef.current
    if (container) container.addEventListener('scroll', handleScroll)
    return () => container?.removeEventListener('scroll', handleScroll)
  }, [])

  const sceneOpacities = useMemo(() => {
    return SCENE_OPTIONS.reduce((acc, scene) => {
      let relAngle = (scene.angle + dialRotation) % 360
      while (relAngle < -180) relAngle += 360
      while (relAngle > 180) relAngle -= 360
      const dist = Math.abs(relAngle)
      acc[scene.key] = Math.max(0, 1 - dist / 120)
      return acc
    }, {})
  }, [dialRotation])

  const activeSceneKey = useMemo(() => {
    let maxOpacity = -1, key = 'night'
    Object.entries(sceneOpacities).forEach(([k, v]) => {
      if (v > maxOpacity) { maxOpacity = v; key = k; }
    })
    return key
  }, [sceneOpacities])

  const chatOpacity = useMemo(() => {
    const normalizedRot = ((-dialRotation % 360) + 360) % 360
    const distToSnap = Math.abs((normalizedRot % 120))
    const finalDist = Math.min(distToSnap, 120 - distToSnap)
    const dialOpacity = Math.max(0, 1 - finalDist / 45)
    const scrollFade = Math.max(0, 1 - scrollPos * 2)
    return dialOpacity * scrollFade
  }, [dialRotation, scrollPos])

  const quoteOpacity = useMemo(() => {
    const normalizedRot = ((-dialRotation % 360) + 360) % 360
    const distToSnap = Math.abs((normalizedRot % 120))
    const finalDist = Math.min(distToSnap, 120 - distToSnap)
    const dialOpacity = Math.max(0, 1 - finalDist / 25)
    const scrollFade = Math.max(0, 1 - scrollPos * 2)
    return dialOpacity * scrollFade
  }, [dialRotation, scrollPos])

  const activeQuote = useMemo(() => SCENE_QUOTES[activeSceneKey][language], [activeSceneKey, language])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    dragRef.current = { startX: e.clientX, startRot: dialRotation }
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragRef.current.startX
      setDialRotation(dragRef.current.startRot + deltaX * 1.2)
    }
    const handleMouseUp = () => {
      setIsDragging(false)
      setDialRotation(Math.round(dialRotation / 120) * 120)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dialRotation])

  // 学生端聊天发送（支持文件和图片）
  const handleSend = async (e) => {
    e.preventDefault()
    if ((!input.trim() && !attachedFile) || isSending) return
    setIsSending(true)
    try {
      // 构建 FormData
      const formData = new FormData()
      formData.append('message', input.trim())
      if (attachedFile) {
        formData.append('file', attachedFile)
      }
      // 注意：原 sendChatMessage 是 json 格式，这里假设后端能接收 FormData
      // 如果后端不能，可以只发送文本，并显示提示
      // 为了兼容，我们尝试调用原 API，但需要修改 chat.js 支持 FormData
      // 这里直接使用 fetch 示例，或者你可以保留原调用但只传文本
      // 更好的方式：扩展 sendChatMessage 支持 formData，但为了快速演示，我们单独发请求
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('发送失败')
      // 清空输入和附件
      setInput('')
      setAttachedFile(null)
    } catch (err) {
      console.error(err)
      alert(t.send === 'Send' ? 'Failed to send message' : '发送失败，请检查后端')
    } finally {
      setIsSending(false)
    }
  }

  // 处理文件附件选择
  const handleAttachFile = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAttachedFile(file)
    }
  }
  const removeAttachedFile = () => setAttachedFile(null)

  // 教师端上传资源
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataURL = ev.target.result
      const sizeKB = Math.round(selectedFile.size / 1024)
      const newResource = {
        id: generateId(),
        name: selectedFile.name,
        type: uploadType,
        sizeKB: sizeKB,
        dataURL: dataURL,
        uploadDate: new Date().toLocaleDateString(),
      }
      setResources(prev => [newResource, ...prev])
      setSelectedFile(null)
      const fileInput = document.getElementById('resource-file')
      if (fileInput) fileInput.value = ''
      setIsUploading(false)
    }
    reader.onerror = () => setIsUploading(false)
    reader.readAsDataURL(selectedFile)
  }

  const handleDelete = (id) => {
    setResources(prev => prev.filter(r => r.id !== id))
  }

  const handleDownload = (resource) => {
    if (resource.dataURL) {
      const link = document.createElement('a')
      link.href = resource.dataURL
      link.download = resource.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert(`Demo: ${resource.name} would be downloaded.`)
    }
  }

  const toggleRole = () => {
    setRole(prev => prev === 'student' ? 'teacher' : 'student')
  }

  // ---------- 渲染 ----------
  return (
    <div className="app-container" ref={containerRef}>
      <main className={`page scene-${activeSceneKey}`}>
        {SCENE_OPTIONS.map(opt => (
          <div key={opt.key} className={`scene-layer scene-${opt.key}`} style={{ opacity: sceneOpacities[opt.key] }}>
            <div className="scene-halo" aria-hidden="true" />
            <div className="scene-motion" aria-hidden="true" />
            <div className="scene-motion-secondary" aria-hidden="true" />
            {opt.key === 'night' && <div className="scene-meteor" aria-hidden="true" />}
          </div>
        ))}

        <header className={`topbar ${scrollPos > 0.5 ? 'topbar-scrolled' : ''}`}>
          <div className="brand">
            <img src={logoImg} alt="Logo" className="logo-img" />
            <span className="brand-text">{t.brand}</span>
          </div>
          <div className="topbar-actions">
            <button className="ghost-btn" onClick={toggleRole}>
              {role === 'student' ? t.switchRole : t.switchRoleStudent}
            </button>
            <div className="settings-wrap">
              <button type="button" className="ghost-btn" onClick={() => setSettingsOpen(!settingsOpen)}>
                {t.settings}
              </button>
              {settingsOpen && (
                <div className="settings-menu">
                  <div className="settings-item">
                    <span>{t.language}</span>
                    <div className="lang-switch">
                      <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
                      <button className={language === 'zh' ? 'active' : ''} onClick={() => setLanguage('zh')}>中文</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button type="button" className="ghost-btn" onClick={() => setAuthModal('login')}>{t.login}</button>
            <button type="button" className="solid-btn" onClick={() => setAuthModal('signup')}>{t.signup}</button>
          </div>
        </header>

        <section className="section section-chat">
          <div style={{
            maxWidth: '800px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '40px',
            transition: 'all 0.5s ease',
            opacity: chatOpacity,
            transform: `scale(${0.98 + chatOpacity * 0.02}) translateY(${scrollPos * -50}px)`
          }}>
            {role === 'student' ? (
              <>
                <div className="chat-title">
                  <img src={logoImg} alt="Logo" className="logo-img logo-img-lg" />
                  <h1>{t.studentTitle}</h1>
                </div>
                <form className="composer" onSubmit={handleSend} style={{ flexDirection: 'column', gap: '12px' }}>
                  {/* 文件附件预览区 */}
                  {attachedFile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                      {attachedFile.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(attachedFile)} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <span>📎 {attachedFile.name}</span>
                      )}
                      <button type="button" onClick={removeAttachedFile} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={t.placeholder}
                      rows={1}
                      style={{ flex: 1 }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label htmlFor="file-attach" className="ghost-btn" style={{ cursor: 'pointer', padding: '8px 12px', fontSize: '18px' }} title={t.attachFile}>
                        📎
                      </label>
                      <input type="file" id="file-attach" style={{ display: 'none' }} onChange={handleAttachFile} />
                      <button type="submit" disabled={(!input.trim() && !attachedFile) || isSending} className="solid-btn">
                        {isSending ? t.sending : t.send}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="chat-title">
                  <img src={logoImg} alt="Logo" className="logo-img logo-img-lg" />
                  <h1>{t.teacherTitle}</h1>
                </div>
                <div className="composer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', opacity: 0.7 }}>{t.selectFile}</label>
                      <input
                        id="resource-file"
                        type="file"
                        onChange={handleFileChange}
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '8px 12px', width: '100%', color: 'inherit' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', opacity: 0.7 }}>{t.chooseType}</label>
                      <select
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '8px 12px', width: '100%', color: 'inherit' }}
                      >
                        {RESOURCE_TYPES.map(type => (
                          <option key={type} value={type} style={{ background: '#1a1a1a', color: '#fff' }}>{t.filters[type]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="solid-btn"
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    {isUploading ? t.uploading : t.uploadButton}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="scene-dial-wrap" style={{ opacity: chatOpacity, transform: `translateY(${scrollPos * 100}px)` }}>
            <div className="dial-pointer" aria-hidden="true" />
            <div className="scene-dial" onMouseDown={handleMouseDown} style={{
              transform: `rotate(${dialRotation}deg)`,
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <div className="dial-divider" style={{ transform: 'rotate(60deg)' }} />
              <div className="dial-divider" style={{ transform: 'rotate(180deg)' }} />
              <div className="dial-divider" style={{ transform: 'rotate(300deg)' }} />
              {SCENE_OPTIONS.map((opt, idx) => (
                <div key={opt.key} className={`dial-item ${activeSceneKey === opt.key ? 'active' : ''}`} style={{
                  transform: `rotate(${idx * 120}deg) translateY(-38px) rotate(${-idx * 120 - dialRotation}deg)`
                }}>
                  <LineIcon type={opt.key} />
                </div>
              ))}
            </div>
          </div>

          <footer className="scene-quote-footer" style={{ opacity: quoteOpacity, transform: `translateY(${scrollPos * 50}px)` }}>
            <blockquote className="scene-quote">
              <p>{activeQuote.text}</p>
              <cite>- {activeQuote.author}</cite>
            </blockquote>
          </footer>

          <div className="scroll-indicator" style={{ opacity: chatOpacity }}>
            <span>{t.scrollDown}</span>
            <div className="arrow-down" />
          </div>
        </section>

        <section className="section section-resources" style={{
          opacity: Math.min(1, (scrollPos - 0.2) * 2),
          transform: `translateY(${(1 - scrollPos) * 100}px)`
        }}>
          <ResourceGrid
            resources={resources}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            t={t}
            role={role}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        </section>
      </main>

      {authModal && (
        <div className="auth-overlay" onClick={() => setAuthModal(null)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAuthModal(null)}>&times;</button>
            <div className="auth-header">
              <img src={logoImg} alt="Logo" className="logo-img" />
              <h2>{authModal === 'login' ? t.auth.loginTitle : t.auth.signupTitle}</h2>
            </div>
            <form className="auth-form" onSubmit={e => e.preventDefault()}>
              <div className="form-group">
                <label>{t.auth.email}</label>
                <input type="email" placeholder="example@email.com" />
              </div>
              <div className="form-group">
                <label>{t.auth.password}</label>
                <input type="password" placeholder="••••••••" />
              </div>
              {authModal === 'signup' && (
                <div className="form-group">
                  <label>{t.auth.confirmPassword}</label>
                  <input type="password" placeholder="••••••••" />
                </div>
              )}
              <button type="submit" className="auth-submit">
                {authModal === 'login' ? t.auth.loginBtn : t.auth.signupBtn}
              </button>
            </form>
            <div className="auth-footer">
              {authModal === 'login' ? (
                <p>{t.auth.noAccount} <span onClick={() => setAuthModal('signup')}>{t.auth.signupBtn}</span></p>
              ) : (
                <p>{t.auth.hasAccount} <span onClick={() => setAuthModal('login')}>{t.auth.loginBtn}</span></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App