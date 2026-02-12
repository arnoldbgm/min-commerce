"use client"
import { useState } from 'react'
 
export default function Counter() {
  const [count, setCount] = useState(0)
 
  return (
    <div className='flex justify-center'>
      <p className='text-blue-700'>Count: {count}</p>
      <button className='bg-blue-900 p-5'  onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}