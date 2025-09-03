"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HardDrive, ChevronDown, Check, X } from "lucide-react"

interface HardDriveFilterProps {
  hardDrives: string[]
  selectedHardDrive: string | undefined
  onSelect: (hardDrive: string | undefined) => void
}

export default function HardDriveFilter({ hardDrives, selectedHardDrive, onSelect }: HardDriveFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleSelect = (drive?: string) => {
    onSelect(drive)
    setIsOpen(false)
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(undefined)
  }

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      })
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleResize = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        })
      }
    }

    if (isOpen) {
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleResize)
      }
    }
  }, [isOpen])

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        onClick={toggleDropdown}
        className="w-full sm:w-[280px] lg:w-[320px] justify-between bg-white/10 border-white/20 hover:border-[#feca57] hover:bg-white/15 text-foreground rounded-full px-3 sm:px-4 py-2 h-auto min-h-[40px] sm:min-h-[44px] text-sm sm:text-base"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-[#feca57]" />
            {selectedHardDrive && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff6b6b] rounded-full"></div>
            )}
          </div>
          <span className="font-medium text-sm sm:text-base truncate">
            {selectedHardDrive || "Tüm Harddiskler"}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {selectedHardDrive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-red-500/20 rounded-full"
            >
              <X className="h-2 w-2 sm:h-3 sm:w-3 text-red-400" />
            </Button>
          )}
          <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 text-[#feca57] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </Button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <Card 
            className="fixed z-[9999] border-border shadow-2xl bg-white dark:bg-gray-900"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width
            }}
          >
            <CardContent className="p-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  onClick={() => handleSelect(undefined)}
                  className={`w-full justify-between px-2 sm:px-3 py-2 h-auto rounded-lg text-left text-sm sm:text-base ${
                    !selectedHardDrive 
                      ? 'bg-[#feca57]/20 text-[#feca57] font-medium' 
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-[#feca57] flex-shrink-0" />
                    <span>Tüm Harddiskler</span>
                  </div>
                  {!selectedHardDrive && (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-[#feca57] flex-shrink-0" />
                  )}
                </Button>
                
                {hardDrives.map((drive) => (
                  <Button
                    key={drive}
                    variant="ghost"
                    onClick={() => handleSelect(drive)}
                    className={`w-full justify-between px-2 sm:px-3 py-2 h-auto rounded-lg text-left text-sm sm:text-base ${
                      selectedHardDrive === drive 
                        ? 'bg-[#ff6b6b]/20 text-[#ff6b6b] font-medium' 
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-[#ff6b6b]" />
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#feca57] rounded-full"></div>
                      </div>
                      <span className="truncate">{drive}</span>
                    </div>
                    {selectedHardDrive === drive && (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-[#ff6b6b] flex-shrink-0" />
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>,
        document.body
      )}
    </div>
  )
}
