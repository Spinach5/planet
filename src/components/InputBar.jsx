import { Input } from "@tarojs/components"
import { useState } from "react"
import './InputBar.css'
import { AtIcon } from "taro-ui"

export default function InputBar({
  className = '',
  placeholder,
  onInput = (input)=>{}
}) {
  const [value, setValue] = useState('')
  const handleInput = (e) => {
    const value = e.detail.value
    setValue(value)
    onInput(value)
  }
  const handleClear = () => {
    setValue('')
    onInput('')
  }
  return (
    <Input
      value={value}
      className={`input-field ${className}`}
      type='text' placeholder={placeholder} focus
      onInput={handleInput}
    >
      <AtIcon value="close" color="#1a2c3e" className="icon" onClick={handleClear} />
    </Input>
  )
}
