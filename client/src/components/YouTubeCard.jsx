import React from 'react';

export default function YouTubeCard({ video }) {
  if (!video) return null;

  const videoUrl = video.url || `https://www.youtube.com/watch?v=${video.videoId || video.id}`;
  const thumbnailUrl = video.thumbnail || (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg` : '');

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-150 flex flex-col group">
      {/* Thumbnail with hover indicator */}
      <a 
        href={videoUrl}
        target="_blank" 
        rel="noopener noreferrer"
        className="relative block aspect-video w-full bg-slate-900 overflow-hidden"
      >
        <img 
          src={thumbnailUrl} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </a>

      {/* Video Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            <span className="truncate">{video.channel || 'Educational Channel'}</span>
          </div>
          <h4 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {video.title}
          </h4>
        </div>

        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            {video.duration || 'Video Tutorial'}
          </span>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>Watch Tutorial</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
