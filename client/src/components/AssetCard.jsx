// One card for one generated asset, with a Download button.
function AssetCard({ asset }) {
  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-stone-200 bg-white">
      {/* aspect-square keeps the picture area a square, whatever the image shape */}
      <div className="flex aspect-square items-center justify-center bg-stone-100">
        <img
          className="max-h-full max-w-full"
          src={asset.url}
          alt={`${asset.platform} version`}
        />
      </div>

      <div className="px-4 pb-4 pt-3.5">
        <p className="mb-1 font-semibold">{asset.platform}</p>
        <p className="text-[13px] text-stone-500">
          {asset.width} × {asset.height} · {asset.format}
        </p>

        {/* A normal link. The server's header makes the browser save the file. */}
        <a
          className="mt-3.5 block rounded-[10px] border-[1.5px] border-stone-300 bg-white py-2.5 text-center text-sm font-semibold text-stone-900 transition-colors hover:border-stone-900 hover:bg-stone-100"
          href={asset.downloadUrl}
        >
          Download
        </a>
      </div>
    </div>
  );
}

export default AssetCard;