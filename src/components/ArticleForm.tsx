'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { WandIcon, InfoIcon, ChevronDownIcon } from 'lucide-react'
import type { FormData } from '../types/FormData'  // Import FormData interface
import { supabase } from '../lib/supabase'

interface ProjectFolder {
  id: number;
  name: string;
}

interface ArticleFormProps {
  onSubmit: (formData: FormData) => void;
  wordsRemaining: number;
  totalWords: number;
  userEmail: string;  // Add this to fetch user-specific folders
}

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, onChange, options, placeholder }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <div className="relative">
      <Select onValueChange={onChange} value={value} required>
        <SelectTrigger className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100">
          <SelectValue placeholder={placeholder} />
          <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </SelectTrigger>
        <SelectContent className="mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
)

export default function ArticleForm({ onSubmit, wordsRemaining, totalWords, userEmail }: ArticleFormProps) {
  const [title, setTitle] = useState('')
  const [articleType, setArticleType] = useState('')
  const [keywords, setKeywords] = useState('')
  const [description, setDescription] = useState('')
  const [tone, setTone] = useState('')
  const [length, setLength] = useState('')
  const [language, setLanguage] = useState('Norsk')
  const [includeImages, setIncludeImages] = useState(false)
  const [includeVideos, setIncludeVideos] = useState(false)
  const [includeSources, setIncludeSources] = useState(false)
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const [numberOfSources, setNumberOfSources] = useState<number>(1)
  const [projectFolders, setProjectFolders] = useState<ProjectFolder[]>([])
  const [selectedProject, setSelectedProject] = useState('')

  useEffect(() => {
    fetchProjectFolders()
  }, [userEmail])

  const fetchProjectFolders = async () => {
    const { data, error } = await supabase
      .from('project_folders')
      .select('id, name')
      .eq('user_email', userEmail)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching project folders:', error)
    } else {
      setProjectFolders(data || [])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = { 
      title, 
      articleType, 
      projectId: selectedProject, // Include the selected project ID
      keywords, 
      description, 
      tone, 
      length, 
      language, 
      includeImages, 
      includeVideos, 
      includeSources, 
      enableWebSearch, 
      numberOfSources 
    }
    onSubmit(formData)
  }

  const handleIncludeSourcesChange = (checked: boolean) => {
    setIncludeSources(checked)
    if (checked) {
      setEnableWebSearch(true)
    } else {
      setNumberOfSources(1)
    }
  }

  const handleNumberOfSourcesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 1 && value <= 5) {
      setNumberOfSources(value)
    }
  }

  const ExtraOption = ({ id, label, checked, onChange, tooltip, disabled = false, children }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Label htmlFor={id} className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <InfoIcon size={16} className="text-gray-400" />
                <span>{label}</span>
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {children}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="bg-gray-200 data-[state=checked]:bg-[#06f] dark:bg-gray-700"
        disabled={disabled}
      />
    </div>
  )

  const estimatedWordCount = getEstimatedWordCount(length);
  const isSubmitDisabled = estimatedWordCount > wordsRemaining;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tittel</label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Skriv inn artikkeltittel"
          className="dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <CustomSelect
        label="Artikkel type"
        value={articleType}
        onChange={setArticleType}
        options={[
          { value: "seo", label: "SEO - Artikkel" },
          { value: "student", label: "Studentoppgave" },
          { value: "standard", label: "Standard artikkel" },
          { value: "list", label: "Liste (F.eks top 5 reisemål)" },
        ]}
        placeholder="Velg artikkel type"
      />
      <CustomSelect
        label="Prosjekt"
        value={selectedProject}
        onChange={setSelectedProject}
        options={projectFolders.map(folder => ({ value: folder.id.toString(), label: folder.name }))}
        placeholder="Velg prosjekt (valgfritt)"
      />
      <CustomSelect
        label="Tone"
        value={tone}
        onChange={setTone}
        options={[
          { value: "formal", label: "Formell" },
          { value: "casual", label: "Uformell" },
          { value: "humorous", label: "Humoristisk" },
          { value: "serious", label: "Seriøs" },
          { value: "optimistic", label: "Optimistisk" },
        ]}
        placeholder="Velg tone"
      />
      <CustomSelect
        label="Artikkel lengde"
        value={length}
        onChange={setLength}
        options={[
          { value: "short", label: "Kort (~500 ord)" },
          { value: "medium", label: "Middels (~1000 ord)" },
          { value: "long", label: "Lang (~1500 ord)" },
        ]}
        placeholder="Velg artikkel lengde"
      />
      <CustomSelect
        label="Språk"
        value={language}
        onChange={setLanguage}
        options={[
          { value: "Norsk", label: "Norsk" },
          { value: "Svensk", label: "Svensk" },
          { value: "Dansk", label: "Dansk" },
        ]}
        placeholder="Velg språk"
      />
      <div>
        <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nøkkelord</label>
        <Input
          id="keywords"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Skriv inn nøkkelord (kommaseparert)"
          className="dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Artikkelbeskrivelse</label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beskriv hva artikkelen vil handle om"
          rows={4}
          className="dark:bg-gray-700 dark:text-white"
          required
        />
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ekstra alternativer</h3>
        <ExtraOption
          id="include-sources"
          label="Inkluder kilder"
          checked={includeSources}
          onChange={handleIncludeSourcesChange}
          tooltip="Legg til kildehenvisninger for å støtte påstander og gi kredibilitet til artikkelen."
        >
          {includeSources && (
            <div className="flex items-center ml-4">
              <label htmlFor="number-of-sources" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                Antall kilder:
              </label>
              <Input
                id="number-of-sources"
                type="number"
                min="1"
                max="5"
                value={numberOfSources}
                onChange={handleNumberOfSourcesChange}
                className="w-16 text-center"
              />
            </div>
          )}
        </ExtraOption>
        <ExtraOption
          id="enable-web-search"
          label="Aktiver websøk"
          checked={enableWebSearch}
          onChange={setEnableWebSearch}
          tooltip="Tillat AI-en å søke på nettet for oppdatert og relevant informasjon til artikkelen."
          disabled={includeSources}
        />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        Gjenværende ord: {wordsRemaining} / Totalt: {totalWords}
      </p>
      <Button 
        type="submit" 
        className="w-full h-[60px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out flex items-center justify-center space-x-2"
        disabled={isSubmitDisabled}
      >
        <WandIcon size={24} />
        <span>Opprett Artikkel</span>
        <WandIcon size={24} />
      </Button>
      {isSubmitDisabled && (
        <p className="text-red-500 text-sm">Ikke nok ord igjen. Vennligst oppgrader pakken din eller kjøp flere ord.</p>
      )}
    </form>
  )
}

function getEstimatedWordCount(length: string): number {
  switch (length) {
    case 'short': return 500;
    case 'medium': return 1000;
    case 'long': return 1500;
    default: return 1000;
  }
}