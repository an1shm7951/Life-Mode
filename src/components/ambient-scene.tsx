export function AmbientScene() {
  return (
    <div className="ambient-scene" aria-hidden="true">
      <div className="ambient-scene-grid" />
      <div className="ambient-scene-stars" />
      <div className="ambient-scene-glow ambient-glow-one" />
      <div className="ambient-scene-glow ambient-glow-two" />
      <div className="ambient-scene-glow ambient-glow-three" />
      <div className="ambient-scene-ascension">
        <div className="ascension-rings" />
        <div className="ascension-beam" />
        <i className="ascension-spark ascension-spark-one" />
        <i className="ascension-spark ascension-spark-two" />
        <i className="ascension-spark ascension-spark-three" />
        <div className="ascension-horizon" />
      </div>
      <div className="ambient-scene-cursor" />
    </div>
  );
}
