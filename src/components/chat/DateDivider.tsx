import React from 'react'

interface DateDividerProps {
  date: string
}

const DateDivider: React.FC<DateDividerProps> = ({ date }) => {
  return (
    <div className="my-3 flex justify-center">
      <div className="bg-muted/70 rounded-full px-4 py-1 text-xs">{date}</div>
    </div>
  )
}

export default DateDivider
