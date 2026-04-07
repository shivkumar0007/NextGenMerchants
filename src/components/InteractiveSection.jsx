import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const InteractiveSection = () => {
  const navigate = useNavigate();

  return (
    <section
      id="explore"
      className="bg-gradient-to-b from-transparent to-purple-900/10 px-6 py-24"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[3rem] border border-white/5 bg-white/5 p-10 md:p-20">
        <div className="relative z-10 flex flex-col items-center gap-12 md:flex-row">
          <div className="flex-1">
            <h2 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
              Experience Shopping <br /> Like Never Before
            </h2>
            <p className="mb-8 max-w-md text-gray-400">
              Our interactive Reels UI allows you to browse live product
              demonstrations and checkout instantly without ever leaving the feed.
            </p>
            <ul className="space-y-4">
              {["One-tap checkout", "Real-time stock alerts", "Live AR overlays"].map(
                (item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm font-medium text-gray-300"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" /> {item}
                  </li>
                )
              )}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-full bg-white px-6 py-3 font-semibold text-black"
              >
                Open Shopping Hub
              </button>
              <button
                onClick={() => navigate("/product/fallback-1")}
                className="rounded-full border border-white/15 px-6 py-3 font-semibold hover:bg-white/10"
              >
                Preview Product Flow
              </button>
            </div>
          </div>

          <div className="flex flex-1 justify-center">
            <motion.div
              initial={{ rotate: 10, y: 40 }}
              whileInView={{ rotate: 0, y: 0 }}
              className="relative h-[450px] w-64 overflow-hidden rounded-[3rem] border-[8px] border-white/10 bg-black shadow-2xl"
            >
              <div className="absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black via-transparent to-transparent p-6">
                <div className="mb-4 h-10 w-10 rounded-full bg-gray-600" />
                <div className="mb-2 h-2 w-3/4 rounded-full bg-white/20" />
                <div className="h-2 w-1/2 rounded-full bg-white/20" />
              </div>
              <div className="h-full w-full animate-pulse bg-gradient-to-br from-purple-800 to-blue-900" />
            </motion.div>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[100px]" />
      </div>
    </section>
  );
};

export default InteractiveSection;
