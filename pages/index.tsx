export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold">🚀 Montridge</h1>
      <p className="text-gray-400 mt-2">AI-powered news intelligence platform - Live on Vercel</p>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <a href="/login" className="bg-blue-600 p-4 rounded hover:bg-blue-700">Login</a>
        <a href="/dashboard" className="bg-blue-600 p-4 rounded hover:bg-blue-700">Dashboard</a>
        <a href="/map" className="bg-blue-600 p-4 rounded hover:bg-blue-700">Map</a>
        <a href="/intelligence/1" className="bg-blue-600 p-4 rounded hover:bg-blue-700">Intelligence</a>
      </div>
    </div>
  )
}
