import { convert } from '@pdf2md/core'

let selectedFiles = []
let isConverting = false

const $ = (id) => document.getElementById(id)

const dropZone = $('dropZone')
const fileInput = $('fileInput')
const folderInput = $('folderInput')
const fileList = $('fileList')
const convertBtn = $('convertBtn')
const progress = $('progress')
const results = $('results')

$('selectFilesBtn').onclick = pickFiles
$('selectFolderBtn').onclick = pickFolder

dropZone.onclick = pickFiles

dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over') }
dropZone.ondragleave = () => dropZone.classList.remove('drag-over')
dropZone.ondrop = async (e) => {
  e.preventDefault()
  dropZone.classList.remove('drag-over')
  const items = [...e.dataTransfer.items]
  const files = await getFilesFromDT(items)
  if (files.length) addFiles(files)
}

async function getFilesFromDT(items) {
  const files = []
  for (const item of items) {
    const entry = item.webkitGetAsEntry()
    if (entry) {
      const collected = await traverseEntry(entry)
      files.push(...collected)
    } else if (item.kind === 'file') {
      const f = item.getAsFile()
      if (f && f.name.toLowerCase().endsWith('.pdf')) files.push(f)
    }
  }
  return files
}

function traverseEntry(entry) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((f) => {
        resolve(f.name.toLowerCase().endsWith('.pdf') ? [f] : [])
      })
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const all = []
      ;(function readBatch() {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            Promise.all(all.map(traverseEntry)).then((nested) => resolve(nested.flat()))
          } else {
            all.push(...entries)
            readBatch()
          }
        })
      })()
    } else {
      resolve([])
    }
  })
}

fileInput.onchange = () => { addFiles([...fileInput.files]); fileInput.value = '' }
folderInput.onchange = () => { addFiles([...folderInput.files]); folderInput.value = '' }

async function pickFiles() {
  if (window.showOpenFilePicker) {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        types: [{ description: 'PDF Files', accept: { 'application/pdf': ['.pdf'] } }]
      })
      const files = await Promise.all(handles.map(h => h.getFile()))
      addFiles(files)
      return
    } catch (err) {
      if (err.name === 'AbortError') return
    }
  }
  fileInput.click()
}

async function pickFolder() {
  if (window.showDirectoryPicker) {
    try {
      const handle = await window.showDirectoryPicker()
      const files = await traverseDirHandle(handle)
      addFiles(files)
      return
    } catch (err) {
      if (err.name === 'AbortError') return
    }
  }
  folderInput.click()
}

async function traverseDirHandle(handle) {
  const files = []
  for await (const entry of handle.values()) {
    if (entry.kind === 'file') {
      if (entry.name.toLowerCase().endsWith('.pdf')) {
        files.push(await entry.getFile())
      }
    } else if (entry.kind === 'directory') {
      const nested = await traverseDirHandle(entry)
      files.push(...nested)
    }
  }
  return files
}

function addFiles(files) {
  const existing = new Set(selectedFiles.map((f) => f.name + f.size))
  const newFiles = files.filter((f) => !existing.has(f.name + f.size))
  if (!newFiles.length) return
  selectedFiles = [...selectedFiles, ...newFiles]
  renderFileList()
  convertBtn.disabled = false
}

function renderFileList() {
  fileList.classList.remove('hidden')
  fileList.textContent = ''
  const count = document.createElement('div')
  count.className = 'file-count'
  count.textContent = `${selectedFiles.length} PDF${selectedFiles.length !== 1 ? 's' : ''} selected`
  fileList.appendChild(count)
  const ul = document.createElement('ul')
  ul.className = 'file-items'
  for (const f of selectedFiles) {
    const li = document.createElement('li')
    li.className = 'file-item'
    const name = document.createElement('span')
    name.className = 'file-name'
    name.textContent = f.name
    name.title = f.name
    li.appendChild(name)
    const size = document.createElement('span')
    size.className = 'file-size'
    size.textContent = formatSize(f.size)
    li.appendChild(size)
    ul.appendChild(li)
  }
  fileList.appendChild(ul)
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

convertBtn.onclick = async () => {
  if (isConverting || !selectedFiles.length) return
  isConverting = true
  convertBtn.disabled = true
  convertBtn.textContent = 'Converting...'
  progress.classList.remove('hidden')
  progress.innerHTML = ''
  results.classList.add('hidden')

  let success = 0
  const errors = []

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i]
    const item = document.createElement('div')
    item.className = 'progress-item converting'
    const icon = document.createElement('span')
    icon.className = 'icon'
    const spinner = document.createElement('span')
    spinner.className = 'spinner'
    icon.appendChild(spinner)
    item.appendChild(icon)
    item.appendChild(document.createTextNode(' ' + file.name))
    progress.appendChild(item)

    try {
      const buf = await file.arrayBuffer()
      const result = await convert(buf)
      if (result.status === 'failed') {
        throw new Error(result.messages[0]?.message || 'Conversion failed')
      }
      downloadAsMd(file.name.replace(/\.pdf$/i, '.md'), result.markdown)
      item.textContent = ''
      icon.textContent = '✓'
      item.appendChild(icon)
      item.appendChild(document.createTextNode(' ' + file.name.replace(/\.pdf$/i, '.md')))
      item.className = 'progress-item done'
      success++
    } catch (err) {
      item.textContent = ''
      icon.textContent = '✗'
      item.appendChild(icon)
      item.appendChild(document.createTextNode(' ' + file.name + ': ' + err.message))
      item.className = 'progress-item error'
      errors.push({ file: file.name, error: err.message })
    }

    await new Promise((r) => setTimeout(r, 10))
  }

  isConverting = false
  convertBtn.disabled = true
  convertBtn.textContent = `✓ Done — ${success} converted`
  if (errors.length) convertBtn.textContent += `, ${errors.length} failed`

  const summaryMsg = document.createElement('div')
  summaryMsg.className = 'results-summary'
  const browserName = typeof browser !== 'undefined' && browser.runtime?.getBrowserInfo
    ? 'Firefox' : 'Chrome'
  summaryMsg.textContent = success
    ? `${success} file${success > 1 ? 's' : ''} saved to your Downloads folder`
    : 'No files were converted'
  progress.appendChild(summaryMsg)

  if (errors.length) {
    results.classList.remove('hidden')
    results.textContent = ''
    const summary = document.createElement('div')
    summary.className = 'results-summary'
    summary.textContent = `${success} converted, ${errors.length} failed`
    results.appendChild(summary)
    const errList = document.createElement('div')
    errList.className = 'results-errors'
    for (const e of errors) {
      const line = document.createElement('div')
      line.textContent = `${e.file}: ${e.error}`
      errList.appendChild(line)
    }
    results.appendChild(errList)
  }
}

function downloadAsMd(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)

  const api = typeof browser !== 'undefined' && browser.downloads
    ? browser.downloads
    : typeof chrome !== 'undefined' && chrome.downloads
      ? chrome.downloads
      : null

  if (api) {
    api.download({ url, filename, saveAs: false }).catch(() => {
      fallbackDownload(url, filename)
    })
  } else {
    fallbackDownload(url, filename)
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

function fallbackDownload(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
