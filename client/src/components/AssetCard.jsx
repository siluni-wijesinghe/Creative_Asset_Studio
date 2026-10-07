// One card for one generated asset, with a Download button.
function AssetCard({ asset }) {
  return (
    <div className="asset-card">
      <div className="asset-image-wrap">
        <img src={asset.url} alt={`${asset.platform} version`} />
      </div>
      <div className="asset-info">
        <p className="platform-name">{asset.platform}</p>
        <p className="platform-meta">
          {asset.width} × {asset.height} · {asset.format}
        </p>

        {/* A normal link. The server's header makes the browser save the file. */}
        <a className="download-button" href={asset.downloadUrl}>
          Download
        </a>
      </div>
    </div>
  );
}

export default AssetCard;