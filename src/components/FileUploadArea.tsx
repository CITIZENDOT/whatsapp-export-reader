import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  ClipboardPaste,
  FileText,
  Package as FileZip,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import prettyBytes from 'pretty-bytes'
import React, { useCallback, useEffect, useState } from 'react'
import { useDropzone, type Accept, type FileRejection } from 'react-dropzone'

const AcceptTypes: Accept = {
  'text/plain': ['.txt'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
}

interface FileUploadAreaProps {
  onFileSelect?: (file: File) => void
  onTextSubmit?: (text: string) => void
  processingError?: string | null
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  onTextSubmit,
  processingError,
}) => {
  // --- State Management ---
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null) //
  const [pastedText, setPastedText] = useState<string>('')
  const [textError, setTextError] = useState<string | null>(null)

  useEffect(() => {
    if (processingError) {
      setFileError(null)
      setTextError(null)
      setSelectedFile(null)
    }
  }, [processingError])

  // --- File Upload Logic (onDrop) ---
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setFileError(null)
      setSelectedFile(null)

      if (fileRejections.length > 0) {
        const firstRejection = fileRejections[0]
        const errorMessages = firstRejection.errors.map(e => {
          if (e.code === 'file-invalid-type')
            return 'Invalid file type. Please upload a .txt or .zip file.'

          return e.message
        })
        setFileError(errorMessages[0])
        return
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        console.log(`File accepted: ${file.name}, Size: ${file.size} bytes`)
        setSelectedFile(file)
        setFileError(null)

        if (onFileSelect) {
          onFileSelect(file)
        }
      }
    },
    [onFileSelect]
  )

  // --- Dropzone Hook Setup ---
  const { getRootProps, getInputProps, isDragActive, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      accept: AcceptTypes,
      multiple: false,
      disabled: inputMode !== 'upload', // <-- Disable when not in upload mode
    })

  // --- Text Paste Logic ---
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedText(event.target.value)
    if (event.target.value.trim()) {
      setTextError(null) // Clear error when user types valid text
    }
  }

  const handleSubmitPaste = () => {
    const trimmedText = pastedText.trim()
    if (!trimmedText) {
      setTextError('Pasted text cannot be empty.')
      return
    }
    setTextError(null)
    console.log(`Pasted text submitted. Length: ${trimmedText.length} characters`)
    if (onTextSubmit) {
      onTextSubmit(trimmedText)
      setPastedText('')
    }
  }

  const trySampleChat = (e: React.MouseEvent) => {
    e.preventDefault()
    switchToPasteMode(e)
    setPastedText(
      `05/15/24, 10:30 AM - Alex: Hey Sam! Are we still on for coffee this afternoon?
05/15/24, 10:32 AM - Sam: Hey Alex! Yes, definitely. Around 2 PM at the usual spot? ☕
05/15/24, 10:33 AM - Alex: Sounds perfect! See you then 👍
05/15/24, 10:35 AM - Sam: Great! Btw, did you finish reviewing that document I sent yesterday?
05/15/24, 10:45 AM - Alex: Almost done! Just making a few final notes. Should be finished before lunch. It's looking good overall.
05/15/24, 10:46 AM - Sam: Awesome, no rush at all. Thanks! 😊
05/15/24, 10:50 AM - Alex: Check this out later, thought you might find it interesting: https://example.com/article
05/15/24, 10:51 AM - Sam: Oh cool, thanks! Will take a look.
05/15/24, 10:55 AM - Alex: <Media omitted>
05/15/24, 10:56 AM - Sam: Looks interesting! We can chat about it later.
05/15/24, 1:45 PM - Sam: Heading out now. See you soon!`
    )
  }

  // --- Mode Switching Logic ---
  const switchToPasteMode = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent potential navigation if used in an anchor
    setInputMode('paste')
    setSelectedFile(null)
    setFileError(null)
  }

  const switchToUploadMode = (e: React.MouseEvent) => {
    e.preventDefault()
    setInputMode('upload')
    setPastedText('')
    setTextError(null)
  }

  // --- Utility Functions ---
  const clearFile = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedFile(null)
    setFileError(null)
  }

  // Determine current overall error (preferring file error if in upload mode)
  const currentError = inputMode === 'upload' ? fileError : textError

  const displayError = processingError || (inputMode === 'upload' ? fileError : textError)

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{inputMode === 'upload' ? 'Upload' : 'Paste'} Your Chat Data</CardTitle>
        <CardDescription>
          {inputMode === 'upload' ? (
            <>
              Select or drag your <code>.txt</code> / <code>.zip</code> file, or{' '}
              <Button
                variant="link"
                className="inline h-auto p-0 text-base"
                onClick={switchToPasteMode}
              >
                paste the text content
              </Button>
              .
              You can also {' '}
              <Button
                variant="link"
                className="inline h-auto p-0 text-base"
                onClick={trySampleChat}
              >
                try a sample chat
              </Button>
              .
            </>
          ) : (
            <>
              Paste from your <code>.txt</code> below, or{' '}
              <Button
                variant="link"
                className="inline h-auto p-0 text-base"
                onClick={switchToUploadMode}
              >
                upload a file instead
              </Button>
              .

              You can also {' '}
              <Button
                variant="link"
                className="inline h-auto p-0 text-base"
                onClick={trySampleChat}
              >
                try a sample chat
              </Button>
              .
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          {/* === UPLOAD MODE UI === */}
          {inputMode === 'upload' && (
            <>
              <div
                {...getRootProps()}
                className={cn(
                  'focus:ring-ring flex cursor-pointer flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
                  isDragAccept && !displayError && 'border-green-500 bg-green-500/10',
                  (isDragReject || (displayError && !isDragActive)) &&
                    'border-destructive bg-destructive/10',
                  !isDragActive &&
                    !isDragAccept &&
                    !isDragReject &&
                    !displayError &&
                    'border-muted hover:border-primary/60'
                )}
                aria-label="File upload area"
              >
                <input {...getInputProps()} />
                {isDragReject || displayError ? (
                  <AlertCircle className="text-destructive h-12 w-12" />
                ) : (
                  <UploadCloud
                    className={cn(
                      'h-12 w-12',
                      isDragActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                )}
                <span className="text-lg font-medium">
                  {isDragAccept && !displayError && 'Drop file here. '}
                  {isDragReject && 'File type not accepted. '}
                  {!isDragActive && !displayError && 'Click or Drag File. '}
                </span>
                <p
                  className={cn(
                    'text-sm',
                    displayError || isDragReject ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {displayError ? displayError : `Supports: .txt, .zip.`}
                </p>
              </div>

              {selectedFile && !displayError && (
                <div className="bg-muted/50 flex items-center justify-between overflow-auto rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2 overflow-auto">
                    {selectedFile.name.endsWith('.txt') ? (
                      <FileText className="text-muted-foreground h-5 w-5 flex-shrink-0" />
                    ) : (
                      <FileZip className="text-muted-foreground h-5 w-5 flex-shrink-0" />
                    )}
                    <span className="text-foreground truncate">{selectedFile.name}</span>
                    <span className="text-muted-foreground flex-shrink-0 text-xs">
                      {prettyBytes(selectedFile.size)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearFile}
                    aria-label="Clear selected file"
                  >
                    <XCircle className="text-muted-foreground hover:text-destructive h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* === PASTE MODE UI === */}
          {inputMode === 'paste' && (
            <div className="flex flex-col gap-3">
              {' '}
              {/* Adjusted gap */}
              {/* Label for accessibility */}
              <Label htmlFor="paste-area" className="sr-only">
                Paste Chat Text
              </Label>
              {/* Textarea */}
              <Textarea
                id="paste-area"
                placeholder="Paste the entire content of your _chat.txt file here..."
                value={pastedText}
                onChange={handleTextChange}
                rows={10}
                className={cn(textError ? 'border-destructive focus-visible:ring-destructive' : '')} // Error styling
                aria-label="Chat text paste area"
                aria-invalid={!!displayError} // Use displayError
                aria-describedby={displayError ? 'text-error-message' : undefined}
              />
              {/* Error message display */}
              {displayError && ( // Use displayError
                <p
                  id="text-error-message"
                  className="text-destructive flex items-center gap-1 text-sm"
                >
                  <AlertCircle className="h-4 w-4" /> {displayError}
                </p>
              )}
              {/* Submit Button */}
              <Button onClick={handleSubmitPaste} disabled={!pastedText.trim()} className="w-full">
                {' '}
                {/* Make button full width */}
                <ClipboardPaste className="mr-2 h-4 w-4" /> Process Pasted Text
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FileUploadArea
