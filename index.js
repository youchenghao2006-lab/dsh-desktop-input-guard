export const name = 'desktop-input-guard'
export const inject = ['tools']

const inputApis = /\b(?:SendInput|mouse_event|keybd_event|SetCursorPos|BlockInput|ClipCursor|SetWindowsHookEx[AW]?|AttachThreadInput|InjectTouchInput|InjectSyntheticPointerInput|SwapMouseButton|SendKeys|pyautogui|pydirectinput|autohotkey)\b/i
const windowMutation = /\b(?:ShowWindow(?:Async)?|EnableWindow|SetWindowPos)\b/i
const scheduledTaskChange = /\b(?:Register|Set|Start|Stop|Enable|Disable|Unregister)-ScheduledTask\b|\bschtasks(?:\.exe)?["']?\s+[^\r\n]*?\/(?:create|run|change|end|delete)\b/i
const elevatedOrDetached = /-Verb\s+["']?RunAs\b|\brunas\.exe\b|\bStart-Process\b[^\r\n]*?-WindowStyle\s+["']?Hidden\b/i
const protectedProcess = /\b(?:explorer|SearchHost|StartMenuExperienceHost|ShellExperienceHost|TextInputHost|ctfmon|TextInputManagementService|GameViewer(?:Server|Service|Healthd)?|NVIDIA Overlay)\b/i
const processChange = /\b(?:Stop-Process|taskkill(?:\.exe)?|Restart-(?:Computer|Service)|Stop-Service|Set-Service|Restart-Process)\b|\b(?:kill|pkill)\b|\.\s*(?:Kill|Terminate)\s*\(|\bsc(?:\.exe)?\s+(?:stop|delete|config)\b/i
const legacyHelper = /\b(?:DshUiAgent\d*|dshagent)\b/i
const stateChange = /\b(?:Set-ItemProperty|New-ItemProperty|Remove-ItemProperty)\b|\breg(?:\.exe)?\s+(?:add|delete|import)\b/i
const mouseSettings = /Control Panel[\\/]Mouse\b|\b(?:SwapMouseButtons|ClickLock|MouseKeys)\b/i
const metadata = new Set(['description', 'justification', 'title', 'reason'])

function* argumentStrings(value) {
  if (typeof value === 'string') {
    yield value
  } else if (Array.isArray(value)) {
    for (const item of value) yield* argumentStrings(item)
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (!metadata.has(key)) yield* argumentStrings(item)
    }
  }
}

export function denyDesktopOperation(exec) {
  // Report and documentation edits may quote these operations. Shell calls are
  // checked separately when they attempt to use the same text as commands.
  const values = [...argumentStrings(exec.arguments)]
  const docWrite = /^(?:write(?:_file)?|edit(?:_file)?|multi_edit)$/.test(exec.name)
    && typeof exec.arguments?.file_path === 'string'
    && /\.(?:md|txt|rst)$/i.test(exec.arguments.file_path)
  if (docWrite) return

  // PowerShell backticks can split a literal command or API name.
  const payload = values.join('\n').replaceAll('`', '')
  const deny = reason => `[桌面输入保护] 已拦截${reason}。请优先用文件、文档或应用 API 完成任务。如确需操作 Windows 桌面，请让用户手动执行。`

  if (inputApis.test(payload)) return deny('全局鼠标或键盘自动化')
  if (scheduledTaskChange.test(payload)) return deny('Windows 计划任务变更')
  if (elevatedOrDetached.test(payload)) return deny('提权或隐藏进程启动')
  if (protectedProcess.test(payload) && (processChange.test(payload) || windowMutation.test(payload))) {
    return deny('修改 Windows 桌面、输入、叠加层或 UU远程组件')
  }
  if (mouseSettings.test(payload) && stateChange.test(payload)) return deny('Windows 鼠标配置变更')
  if (legacyHelper.test(payload) && !/^read(?:_file)?$/.test(exec.name)) {
    return deny('访问遗留的 DeepSeek 桌面控制脚本或任务')
  }
}

export function apply(ctx) {
  ctx.tools.guard(denyDesktopOperation)
}
