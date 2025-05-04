import React from 'react'

interface DateDividerProps {
  date: string
}

const DateDivider: React.FC<DateDividerProps> = ({ date }) => {
  return (
    <div className="flex justify-center my-3">
      <div className="bg-muted/70 rounded-full px-4 py-1 text-xs">
        {date}
      </div>
    </div>
  )
}

export default DateDivider