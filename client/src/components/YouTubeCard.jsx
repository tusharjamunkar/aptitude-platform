import React from 'react';

export default function YouTubeCard({ video }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full">
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        <img 
          src={video.thumb} 
          alt={video.title} 
          className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center pl-1 shadow-lg shadow-red-600/50 scale-90 group-hover:scale-100 transition-transform">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z"/></svg>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
          {video.duration}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-bold text-slate-800 line-clamp-2 mb-2 leading-tight group-hover:text-red-600 transition-colors">{video.title}</h4>
        
        <div className="mt-auto">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-4">
            <span>📺</span>
            <span className="truncate">{video.channel}</span>
            <span className="mx-1">•</span>
            <span>{video.views}</span>
          </div>
          
          <button 
            className="w-full py-2.5 bg-red-50 text-red-600 font-bold rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
            onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
          >
            <span>▶</span> Watch Now
          </button>
        </div>
      </div>
    </div>
  );
}
