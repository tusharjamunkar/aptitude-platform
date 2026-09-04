export default function YouTubeCard({ video }) {
  return (
    <div className="card overflow-hidden !p-0 flex flex-col hover:shadow-md transition-shadow">
      <div className="relative aspect-video">
        <img 
          src={video.thumbnail?.url || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {video.duration}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: video.title }} />
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="mr-1">📺</span>
          <span className="line-clamp-1">{video.channelTitle}</span>
        </div>
        <div className="mt-auto">
          <a
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Watch Now
          </a>
        </div>
      </div>
    </div>
  );
}
