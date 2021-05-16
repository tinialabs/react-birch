const FileIcons = {
  TEXT: 'octicons/file',
  DATABASE: 'octicons/database',
  CODE: 'octicons/code',
  REACTIVECARD: 'octicons/gist',
  WHENDO: 'octicons/workflow',
  IMAGE: 'octicons/file-media',
  BITMAP: 'octicons/paintcan',
  AUDIO: 'octicons/radio-tower',
  VIDEO: 'octicons/device-camera-video',
  PDF: 'octicons/file-pdf'
}

export const toFileIcon = (
  mimeType = '',
  extension = '',
  name?: string
): string => {
  switch (extension) {
    case 'md':
    case 'rdx':
      if (name && name.startsWith('audience')) {
        return FileIcons.DATABASE
      }
      return FileIcons.TEXT
    case 'csv':
      return FileIcons.CODE
    case 'rcx':
      return FileIcons.REACTIVECARD
    case 'wdo':
      return FileIcons.WHENDO
    case 'pdf':
      return FileIcons.PDF
    case 'svg':
      return FileIcons.IMAGE
    case 'jpg':
    case 'png':
    case 'gif':
    case 'webp':
      return FileIcons.BITMAP
    case 'mp4':
    case 'webm':
    case 'mov':
      return FileIcons.VIDEO
    default:
      switch (mimeType.split('/')[0]) {
        case 'image':
          return FileIcons.IMAGE
        case 'video':
          return FileIcons.VIDEO
        case 'audio':
          return FileIcons.AUDIO
        case 'text':
        case 'application':
        default:
          return FileIcons.TEXT
      }
  }
}

export const toFileDescription = (
  mimeType = '',
  extension = '',
  name?: string
): string => {
  switch (extension) {
    case 'md':
    case 'rdx':
      if (name && name.startsWith('audience')) {
        return 'Dialog Audience'
      }
      return 'Dialog Markdown'
    case 'csv':
      return 'Document (CSV)'
    case 'rcx':
      return 'Reactive Card'
    case 'wdo':
      return 'When Do Flow'
    case 'pdf':
      return 'Document (PDF)'
    case 'svg':
    case 'jpg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'Image'
    case 'mp4':
    case 'webm':
    case 'mov':
      return 'Video'
    default:
      switch (mimeType.split('/')[0]) {
        case 'image':
          return 'Image'
        case 'video':
          return 'Video'
        case 'audio':
          return 'Audio'
        case 'text':
        case 'application':
        default:
          return 'Document (Other)'
      }
  }
}
