'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [value, setValue] = useState('')

  const handleClick = () => {
    console.log('输入内容：', value)
  }

  return (
    <main className="main-container">
      <h1 className="page-title">Upload</h1>

      <div className="doc-card" style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="公众号url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          onClick={handleClick}
        >
          上传
        </button>
      </div>
    </main>
  )
}