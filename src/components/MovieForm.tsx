"use client"

import type React from "react"

import { useState } from "react"
import type { Movie, MovieFormData } from "@/types/movie"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Film, User, HardDrive, Video, Volume2, Subtitles, LinkIcon, Save, X, Upload, FileText } from "lucide-react"

interface MovieFormProps {
  movie?: Movie
  onSubmit: (data: MovieFormData) => Promise<void>
  onCancel: () => void
  title: string
  existingHardDrives?: string[]
}

export default function MovieForm({ movie, onSubmit, onCancel, title, existingHardDrives = [] }: MovieFormProps) {
  const [formData, setFormData] = useState<MovieFormData>({
    title: movie?.title || "",
    year: movie?.year?.toString() || "",
    director: movie?.director || "",
    hardDrive: movie?.hardDrive || "",
    videoQuality: movie?.videoQuality || "",
    audioQuality: movie?.audioQuality || "",
    hasSubtitles: movie?.hasSubtitles || false,
    watched: movie?.watched || false,
    movieLink: movie?.movieLink || "",
    directorLink: movie?.directorLink || "",
  })

  const [loading, setLoading] = useState(false)
  const [jsonData, setJsonData] = useState("")
  const [showJsonInput, setShowJsonInput] = useState(false)
  const [jsonResults, setJsonResults] = useState<{
    success: boolean;
    results?: Array<{ index: number; id: string; title: string; success: boolean }>;
    errors?: Array<{ index: number; error: string; data: unknown }>;
    successCount?: number;
    errorCount?: number;
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (!formData.title.trim()) {
        throw new Error('Film adı gereklidir')
      }
      
      if (!formData.director.trim()) {
        throw new Error('Yönetmen adı gereklidir')
      }
      
      const yearNum = parseInt(formData.year)
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 5) {
        throw new Error('Geçerli bir yıl giriniz')
      }
      
      const sanitizedData = {
        ...formData,
        title: formData.title.trim(),
        director: formData.director.trim(),
        hardDrive: formData.hardDrive.trim(),
        movieLink: formData.movieLink.trim(),
        directorLink: formData.directorLink.trim()
      }
      
      await onSubmit(sanitizedData)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof MovieFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleJsonSubmit = async () => {
    if (!jsonData.trim()) {
      alert('JSON verisi giriniz')
      return
    }

    setLoading(true)
    setJsonResults(null)
    
    try {
      const cleanedJson = jsonData
        .replace(/…/g, '...')
        .replace(/%20/g, ' ')
        .replace(/%([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      
      const parsedData = JSON.parse(cleanedJson)
      
      const response = await fetch('/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      })

      const result = await response.json()
      setJsonResults(result)
      
      if (result.success) {
        if (Array.isArray(parsedData)) {
          alert(`${result.successCount} film başarıyla eklendi. ${result.errorCount} hata oluştu.`)
        } else {
          alert('Film başarıyla eklendi!')
        }
        
        if (result.errorCount === 0) {
          setJsonData("")
          setShowJsonInput(false)
        }
      } else {
        alert('Hata: ' + result.error)
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        alert('Geçersiz JSON formatı. Lütfen JSON formatını kontrol edin.')
      } else {
        alert('Bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
      }
    } finally {
      setLoading(false)
    }
  }

  const getJsonExample = () => {
    return `[
  {
    "film adı": "Ant Man",
    "yıl": "2015",
    "yönetmen adı": "Peyton Reed",
    "harddisk": "4K Filmler 1",
    "görüntü kalitesi": "BD Remux",
    "ses kalitesi": "DTS-HD",
    "altyazı": "Var",
    "film linki": "https://turkcealtyazi.org/mov/0478970/ant-man.html",
    "yönetmen linki": "https://turkcealtyazi.org/prs/0715636/peyton-reed.html"
  },
  {
    "film adı": "Ant-Man And The Wasp",
    "yıl": "2018", 
    "yönetmen adı": "Peyton Reed",
    "harddisk": "4K Filmler 1",
    "görüntü kalitesi": "BD Remux",
    "ses kalitesi": "",
    "altyazı": "Var",
    "film linki": "https://turkcealtyazi.org/mov/5095030/ant-man-and-the-wasp.html",
    "yönetmen linki": "https://turkcealtyazi.org/prs/0715636/peyton-reed.html"
  }
]`
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-white/20 rounded-xl shadow-2xl relative m-2 sm:m-4 max-h-[90vh] overflow-y-auto right-3.5">
      <Button 
        type="button" 
        onClick={onCancel}
        className="absolute top-3 right-3 z-10 h-7 w-7 sm:h-8 sm:w-8 p-0 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-full"
        title="Kapat"
      >
        <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
      </Button>
      
      <CardHeader className="text-center space-y-2 sm:space-y-3 pr-10 sm:pr-12 pb-4 sm:pb-6">
        <CardTitle className="flex items-center justify-center gap-2 sm:gap-3 text-lg sm:text-xl lg:text-2xl">
          <div className="relative">
            <Film className="h-5 w-5 sm:h-6 sm:w-6 text-[#ff6b6b] drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#feca57] rounded-full animate-ping"></div>
          </div>
          <span className="gradient-text">{title}</span>
        </CardTitle>
        
        {!movie && (
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant={showJsonInput ? "secondary" : "default"}
              size="sm"
              onClick={() => setShowJsonInput(false)}
              className="text-xs"
            >
              <Film className="h-3 w-3 mr-1" />
              Tekli Ekleme
            </Button>
            <Button
              type="button"
              variant={showJsonInput ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowJsonInput(true)}
              className="text-xs"
            >
              <FileText className="h-3 w-3 mr-1" />
              JSON ile Ekleme
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
        {showJsonInput ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jsonData" className="flex items-center gap-2 text-foreground font-medium text-sm">
                <FileText className="h-4 w-4 text-[#ff6b6b]" />
                JSON Verisi
              </Label>
              <textarea
                id="jsonData"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder={getJsonExample()}
                className="w-full h-48 sm:h-64 p-2 sm:p-3 text-xs sm:text-sm border border-white/20 bg-white/10 rounded-md focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b] font-mono resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Türkçe alan isimleri desteklenir. Tek film için obje veya birden fazla film için array formatında JSON girebilirsiniz.
              </p>
            </div>

            {jsonResults && (
              <div className="space-y-2 p-3 border border-white/20 rounded-md bg-white/5">
                <h4 className="font-medium text-sm">Sonuçlar:</h4>
                {jsonResults.results && jsonResults.results.length > 0 && (
                  <div className="text-xs text-green-400">
                    <p>Başarılı: {jsonResults.successCount}</p>
                    {jsonResults.results.map((result, index: number) => (
                      <p key={index}>• {result.title} (ID: {result.id})</p>
                    ))}
                  </div>
                )}
                {jsonResults.errors && jsonResults.errors.length > 0 && (
                  <div className="text-xs text-red-400">
                    <p>Hatalar: {jsonResults.errorCount}</p>
                    {jsonResults.errors.map((error, index: number) => (
                      <p key={index}>• Satır {error.index + 1}: {error.error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center gap-2">
              <Button
                type="button"
                onClick={handleJsonSubmit}
                disabled={loading || !jsonData.trim()}
                className="btn-primary gap-2 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    JSON&apos;dan Ekle
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#feca57]">
              <Film className="h-3 w-3 sm:h-4 sm:w-4" />
              Temel Bilgiler
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="title" className="text-foreground font-medium text-sm">Film Adı *</Label>
                <Input
                  id="title"
                  placeholder="Film adını girin"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                  className="bg-white/10 border-white/20 focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b] text-sm h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year" className="text-foreground font-medium text-sm">Çıkış Yılı *</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2024"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  value={formData.year}
                  onChange={(e) => handleChange("year", e.target.value)}
                  required
                  className="bg-white/10 border-white/20 focus:border-[#feca57] focus:ring-1 focus:ring-[#feca57] text-sm h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="director" className="flex items-center gap-2 text-foreground font-medium text-sm">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-[#ff6b6b]" />
                Yönetmen *
              </Label>
              <Input
                id="director"
                placeholder="Yönetmen adını girin"
                value={formData.director}
                onChange={(e) => handleChange("director", e.target.value)}
                required
                className="bg-white/10 border-white/20 focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b] text-sm h-10"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#feca57]">
              <HardDrive className="h-3 w-3 sm:h-4 sm:w-4" />
              Depolama ve Kalite
            </div>

            <div className="space-y-2">
              <Label htmlFor="hardDrive" className="text-foreground font-medium text-sm">Depolama Konumu *</Label>
              <div className="relative">
                <Input
                  id="hardDrive"
                  list="hardDriveOptions"
                  value={formData.hardDrive}
                  onChange={(e) => handleChange("hardDrive", e.target.value)}
                  placeholder="Depolama cihazını girin veya seçin"
                  required
                  className="bg-white/10 border-white/20 focus:border-[#feca57] focus:ring-1 focus:ring-[#feca57] text-sm h-10"
                />
                <datalist id="hardDriveOptions">
                  {existingHardDrives.map((hd) => (
                    <option key={hd} value={hd} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="videoQuality" className="flex items-center gap-2 text-foreground font-medium text-sm">
                  <Video className="h-3 w-3 sm:h-4 sm:w-4 text-[#ff6b6b]" />
                  Video Kalitesi
                </Label>
                <select
                  id="videoQuality"
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-2 sm:px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] cursor-pointer"
                  value={formData.videoQuality}
                  onChange={(e) => handleChange("videoQuality", e.target.value)}
                >
                  <option value="" className="bg-gray-800 text-white">Kalite seçin</option>
                  <option value="4K Bluray Disk HDR" className="bg-gray-800 text-white">4K Bluray Disk HDR</option>
                  <option value="4K Bluray Disk SDR" className="bg-gray-800 text-white">4K Bluray Disk SDR</option>
                  <option value="4K BD Remux HDR" className="bg-gray-800 text-white">4K BD Remux HDR</option>
                  <option value="4K BD Remux SDR" className="bg-gray-800 text-white">4K BD Remux SDR</option>
                  <option value="4K Remux HDR" className="bg-gray-800 text-white">4K Remux HDR</option>
                  <option value="4K Remux SDR" className="bg-gray-800 text-white">4K Remux SDR</option>
                  <option value="BD Remux" className="bg-gray-800 text-white">BD Remux</option>
                  <option value="Remux" className="bg-gray-800 text-white">Remux</option>
                  <option value="Blu-ray Disk" className="bg-gray-800 text-white">Blu-ray Disk</option>
                  <option value="WEB-DL HDR" className="bg-gray-800 text-white">WEB-DL HDR</option>
                  <option value="WEB-DL SDR" className="bg-gray-800 text-white">WEB-DL SDR</option>
                  <option value="1080p" className="bg-gray-800 text-white">1080p</option>
                  <option value="810p" className="bg-gray-800 text-white">810p</option>
                  <option value="720p" className="bg-gray-800 text-white">720p</option>
                  <option value="576p" className="bg-gray-800 text-white">576p</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioQuality" className="flex items-center gap-2 text-foreground font-medium text-sm">
                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 text-[#feca57]" />
                  Ses Kalitesi
                </Label>
                <select
                  id="audioQuality"
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-2 sm:px-3 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#feca57] focus:border-[#feca57] cursor-pointer"
                  value={formData.audioQuality}
                  onChange={(e) => handleChange("audioQuality", e.target.value)}
                >
                  <option value="" className="bg-gray-800 text-white">Kalite seçin</option>
                  <option value="AC3 1.0" className="bg-gray-800 text-white">AC3 1.0</option>
                  <option value="AC3 2.0" className="bg-gray-800 text-white">AC3 2.0</option>
                  <option value="AC3 5.1" className="bg-gray-800 text-white">AC3 5.1</option>
                  <option value="DDP 2.0" className="bg-gray-800 text-white">DDP 2.0</option>
                  <option value="DDP 5.1" className="bg-gray-800 text-white">DDP 5.1</option>
                  <option value="DDP Atmos 5.1" className="bg-gray-800 text-white">DDP Atmos 5.1</option>
                  <option value="DTS 1.0" className="bg-gray-800 text-white">DTS 1.0</option>
                  <option value="DTS 2.0" className="bg-gray-800 text-white">DTS 2.0</option>
                  <option value="DTS 5.1" className="bg-gray-800 text-white">DTS 5.1</option>
                  <option value="DTSES 5.1" className="bg-gray-800 text-white">DTS-ES 5.1</option>
                  <option value="DTSES 6.1" className="bg-gray-800 text-white">DTS-ES 6.1</option>
                  <option value="DTS-HD MA 1.0" className="bg-gray-800 text-white">DTS-HD MA 1.0</option>
                  <option value="DTS-HD MA 2.0" className="bg-gray-800 text-white">DTS-HD MA 2.0</option>
                  <option value="DTS-HD MA 4.0" className="bg-gray-800 text-white">DTS-HD MA 4.0</option>
                  <option value="DTS-HD MA 5.0" className="bg-gray-800 text-white">DTS-HD MA 5.0</option>
                  <option value="DTS-HD MA 5.1" className="bg-gray-800 text-white">DTS-HD MA 5.1</option>
                  <option value="DTS-HD MA 6.1" className="bg-gray-800 text-white">DTS-HD MA 6.1</option>
                  <option value="DTS-HD MA 7.1" className="bg-gray-800 text-white">DTS-HD MA 7.1</option>
                  <option value="TRUE HD 2.0" className="bg-gray-800 text-white">True HD 2.0</option>
                  <option value="TRUE HD 5.1" className="bg-gray-800 text-white">True HD 5.1</option>
                  <option value="TRUE HD Atmos 7.1" className="bg-gray-800 text-white">TRUE HD Atmos 7.1</option>
                  <option value="LPCM 1.0" className="bg-gray-800 text-white">LPCM 1.0</option>
                  <option value="LPCM 2.0" className="bg-gray-800 text-white">LPCM 2.0</option>
                  <option value="LPCM 5.1" className="bg-gray-800 text-white">LPCM 5.1</option>
                  <option value="FLAC 1.0" className="bg-gray-800 text-white">FLAC 1.0</option>
                  <option value="FLAC 2.0" className="bg-gray-800 text-white">FLAC 2.0</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border border-white/20 rounded-lg bg-white/5">
                <Checkbox
                  id="hasSubtitles"
                  checked={formData.hasSubtitles}
                  onCheckedChange={(checked) => handleChange("hasSubtitles", checked as boolean)}
                  className="border-2 border-[#feca57]/50 data-[state=checked]:bg-[#feca57] data-[state=checked]:border-[#feca57] data-[state=checked]:text-white"
                />
                <Label htmlFor="hasSubtitles" className="flex items-center gap-2 cursor-pointer text-foreground font-medium text-sm">
                  <Subtitles className="h-3 w-3 sm:h-4 sm:w-4 text-[#feca57]" />
                  Altyazı Mevcut
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border border-white/20 rounded-lg bg-white/5">
                <Checkbox
                  id="watched"
                  checked={formData.watched}
                  onCheckedChange={(checked) => handleChange("watched", checked as boolean)}
                  className="border-2 border-[#ff6b6b]/50 data-[state=checked]:bg-[#ff6b6b] data-[state=checked]:border-[#ff6b6b] data-[state=checked]:text-white"
                />
                <Label htmlFor="watched" className="flex items-center gap-2 cursor-pointer text-foreground font-medium text-sm">
                  <Film className="h-3 w-3 sm:h-4 sm:w-4 text-[#ff6b6b]" />
                  Bu filmi izledim
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#feca57]">
              <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              İsteğe Bağlı Linkler
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="movieLink" className="text-foreground font-medium text-sm">Film Linki</Label>
                <Input
                  id="movieLink"
                  type="url"
                  placeholder="https://ornek.com/film"
                  value={formData.movieLink}
                  onChange={(e) => handleChange("movieLink", e.target.value)}
                  className="bg-white/10 border-white/20 focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b] text-sm h-10"
                />
                <p className="text-xs text-muted-foreground">Film bilgisi veya fragman linki</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="directorLink" className="text-foreground font-medium text-sm">Yönetmen Linki</Label>
                <Input
                  id="directorLink"
                  type="url"
                  placeholder="https://ornek.com/yonetmen"
                  value={formData.directorLink}
                  onChange={(e) => handleChange("directorLink", e.target.value)}
                  className="bg-white/10 border-white/20 focus:border-[#feca57] focus:ring-1 focus:ring-[#feca57] text-sm h-10"
                />
                <p className="text-xs text-muted-foreground">Yönetmenin profili veya filmografisi linki</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2 sm:pt-4">
            <Button type="submit" disabled={loading} className="btn-primary gap-2 px-6 sm:px-8 py-2 sm:py-3 rounded-full text-sm sm:text-base lg:text-lg w-full sm:w-auto">
              {loading ? (
                <>
                  <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="hidden sm:inline">Kaydediliyor...</span>
                  <span className="sm:hidden">Kaydediliyor</span>
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Filmi Kaydet</span>
                  <span className="sm:hidden">Kaydet</span>
                </>
              )}
            </Button>
          </div>
        </form>
        )}
      </CardContent>
    </Card>
  )
}
