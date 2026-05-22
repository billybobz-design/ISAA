"use client"

import * as React from "react"
import { Check, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

const SUBJECT_SUGGESTIONS = ["Physics", "Mathematics", "Computer Science", "Biology", "Chemistry", "Economics", "Psychology", "Philosophy", "Literature", "History", "Business", "Engineering", "Debate", "Model UN"]
const SCHOOL_SUGGESTIONS = ["HFI", "NCPA", "ULC", "BSG", "AISG", "ISB", "SAS", "HKIS"]

interface FilterMenuProps {
  selectedSubjects: string[]
  setSelectedSubjects: (tags: string[]) => void
  selectedSchools: string[]
  setSelectedSchools: (tags: string[]) => void
}

export function FilterMenu({ selectedSubjects, setSelectedSubjects, selectedSchools, setSelectedSchools }: FilterMenuProps) {
  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject))
    } else {
      setSelectedSubjects([...selectedSubjects, subject])
    }
  }

  const toggleSchool = (school: string) => {
    if (selectedSchools.includes(school)) {
      setSelectedSchools(selectedSchools.filter((s) => s !== school))
    } else {
      setSelectedSchools([...selectedSchools, school])
    }
  }

  const activeFiltersCount = selectedSubjects.length + selectedSchools.length

  return (
    <Popover>
      <PopoverTrigger render={
        <Button variant="outline" className="h-11 px-4 gap-2 text-slate-600 font-normal">
          <Filter className="h-4 w-4" />
          Filter Tags
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      } />
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup heading="Subject Tags">
              {SUBJECT_SUGGESTIONS.map((subject) => (
                <CommandItem
                  key={subject}
                  onSelect={() => toggleSubject(subject)}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selectedSubjects.includes(subject) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className={cn("h-3 w-3")} />
                  </div>
                  <span>{subject}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="School Tags">
              {SCHOOL_SUGGESTIONS.map((school) => (
                <CommandItem
                  key={school}
                  onSelect={() => toggleSchool(school)}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selectedSchools.includes(school) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                  )}>
                    <Check className={cn("h-3 w-3")} />
                  </div>
                  <span>{school}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
