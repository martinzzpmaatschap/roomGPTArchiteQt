"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { UrlBuilder } from "@bytescale/sdk";
import { UploadWidgetConfig } from "@bytescale/upload-widget";
import { UploadDropzone } from "@bytescale/upload-widget-react";
import { CompareSlider } from "../../components/CompareSlider";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import LoadingDots from "../../components/LoadingDots";
import ResizablePanel from "../../components/ResizablePanel";
import Toggle from "../../components/Toggle";
import appendNewToName from "../../utils/appendNewToName";
import downloadPhoto from "../../utils/downloadPhoto";
import DropDown from "../../components/DropDown";
import { roomType, rooms, themeType, themes } from "../../utils/dropdownTypes";

// =============================================================================
// BYTESCALE UPLOAD WIDGET CONFIGURATION
// =============================================================================
const options: UploadWidgetConfig = {
  apiKey: !!process.env.NEXT_PUBLIC_UPLOAD_API_KEY
    ? process.env.NEXT_PUBLIC_UPLOAD_API_KEY
    : "free",
  maxFileCount: 1,
  mimeTypes: ["image/jpeg", "image/png", "image/jpg"],
  editor: { images: { crop: false } },
  styles: {
    colors: {
      primary: "#10b981", // Emerald — ArchiteQt brand
      error: "#d23f4d",
      shade100: "#fff",
      shade200: "#fffe",
      shade300: "#fffd",
      shade400: "#fffc",
      shade500: "#fff9",
      shade600: "#fff7",
      shade700: "#fff2",
      shade800: "#fff1",
      shade900: "#ffff",
    },
  },
};

export default function DreamPage() {
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoredLoaded, setRestoredLoaded] = useState<boolean>(false);
  const [sideBySide, setSideBySide] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [theme, setTheme] = useState<themeType>("Modern");
  const [room, setRoom] = useState<roomType>("Woonkamer");

  const UploadDropZone = () => (
    <UploadDropzone
      options={options}
      onUpdate={({ uploadedFiles }) => {
        if (uploadedFiles.length !== 0) {
          const image = uploadedFiles[0];
          const imageName = image.originalFile.originalFileName;

          const imageUrl = UrlBuilder.url({
            accountId: image.accountId,
            filePath: image.filePath,
            options: {
              transformation: "image",
              transformationParams: {
                w: 1024,
                h: 1024,
                fit: "max",
              },
            },
          });

          console.log("📸 [ArchiteQt Vision] Image uploaded:", imageName);
          console.log("🔗 [ArchiteQt Vision] Image URL:", imageUrl);

          setPhotoName(imageName);
          setOriginalPhoto(imageUrl);
          generatePhoto(imageUrl);
        }
      }}
      width="670px"
      height="250px"
    />
  );

  async function generatePhoto(fileUrl: string) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    setLoading(true);
    setError(null);

    try {
      console.log("🎨 [ArchiteQt Vision] Starting generation...");
      console.log("   Style:", theme);
      console.log("   Room:", room);

      const res = await fetch("/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: fileUrl, theme, room }),
      });

      const data = await res.json();

      if (res.status !== 200) {
        console.error("❌ [ArchiteQt Vision] Generation failed:", data);
        setError(
          data.message || data.error || "Er ging iets mis bij het genereren"
        );
      } else {
        const imageUrl = Array.isArray(data.output)
          ? data.output[0]
          : data.output;
        console.log("✅ [ArchiteQt Vision] Generation complete:", imageUrl);
        setRestoredImage(imageUrl);
      }
    } catch (err) {
      console.error("❌ [ArchiteQt Vision] Network error:", err);
      setError("Netwerkfout. Controleer je internetverbinding.");
    }

    setTimeout(() => {
      setLoading(false);
    }, 1300);
  }

  return (
    <div className="flex max-w-6xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-4 sm:mb-0 mb-8">
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-normal text-slate-100 sm:text-6xl mb-5">
          Ontwerp je <span className="text-emerald-500">droom</span>kamer
        </h1>
        <ResizablePanel>
          <AnimatePresence mode="wait">
            <motion.div className="flex justify-between items-center w-full flex-col mt-4">
              {!restoredImage && (
                <>
                  <div className="space-y-4 w-full max-w-sm">
                    <div className="flex mt-3 items-center space-x-3">
                      <Image
                        src="/number-1-white.svg"
                        width={30}
                        height={30}
                        alt="Stap 1"
                      />
                      <p className="text-left font-medium">
                        Kies je interieurstijl.
                      </p>
                    </div>
                    <DropDown
                      theme={theme}
                      setTheme={(newTheme) =>
                        setTheme(newTheme as typeof theme)
                      }
                      themes={themes}
                    />
                  </div>
                  <div className="space-y-4 w-full max-w-sm">
                    <div className="flex mt-10 items-center space-x-3">
                      <Image
                        src="/number-2-white.svg"
                        width={30}
                        height={30}
                        alt="Stap 2"
                      />
                      <p className="text-left font-medium">
                        Kies je kamertype.
                      </p>
                    </div>
                    <DropDown
                      theme={room}
                      setTheme={(newRoom) => setRoom(newRoom as typeof room)}
                      themes={rooms}
                    />
                  </div>
                  <div className="mt-4 w-full max-w-sm">
                    <div className="flex mt-6 w-96 items-center space-x-3">
                      <Image
                        src="/number-3-white.svg"
                        width={30}
                        height={30}
                        alt="Stap 3"
                      />
                      <p className="text-left font-medium">
                        Upload een foto van je kamer.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {restoredImage && (
                <div>
                  Dit is je <b>{room.toLowerCase()}</b> in de{" "}
                  <b>{theme.toLowerCase()}</b> stijl!{" "}
                </div>
              )}
              <div
                className={`${
                  restoredLoaded ? "visible mt-6 -ml-8" : "invisible"
                }`}
              >
                <Toggle
                  className={`${restoredLoaded ? "visible mb-6" : "invisible"}`}
                  sideBySide={sideBySide}
                  setSideBySide={(newVal) => setSideBySide(newVal)}
                />
              </div>
              {restoredLoaded && sideBySide && (
                <CompareSlider
                  original={originalPhoto!}
                  restored={restoredImage!}
                />
              )}
              {!originalPhoto && <UploadDropZone />}
              {originalPhoto && !restoredImage && (
                <Image
                  alt="originele foto"
                  src={originalPhoto}
                  className="rounded-2xl h-96"
                  width={475}
                  height={475}
                />
              )}
              {restoredImage && originalPhoto && !sideBySide && (
                <div className="flex sm:space-x-4 sm:flex-row flex-col">
                  <div>
                    <h2 className="mb-1 font-medium text-lg">Origineel</h2>
                    <Image
                      alt="originele foto"
                      src={originalPhoto}
                      className="rounded-2xl relative w-full h-96"
                      width={475}
                      height={475}
                    />
                  </div>
                  <div className="sm:mt-0 mt-8">
                    <h2 className="mb-1 font-medium text-lg">AI Herontwerp</h2>
                    <a href={restoredImage} target="_blank" rel="noreferrer">
                      <Image
                        alt="AI herontwerp"
                        src={restoredImage}
                        className="rounded-2xl relative sm:mt-0 mt-2 cursor-zoom-in w-full h-96"
                        width={475}
                        height={475}
                        onLoadingComplete={() => setRestoredLoaded(true)}
                      />
                    </a>
                  </div>
                </div>
              )}
              {loading && (
                <button
                  disabled
                  className="bg-emerald-600 rounded-full text-white font-medium px-4 pt-2 pb-3 mt-8 w-40"
                >
                  <span className="pt-4">
                    <LoadingDots color="white" style="large" />
                  </span>
                </button>
              )}
              {error && (
                <div
                  className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl mt-8"
                  role="alert"
                >
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <div className="flex space-x-2 justify-center">
                {originalPhoto && !loading && (
                  <button
                    onClick={() => {
                      setOriginalPhoto(null);
                      setRestoredImage(null);
                      setRestoredLoaded(false);
                      setError(null);
                    }}
                    className="bg-emerald-600 rounded-full text-white font-medium px-4 py-2 mt-8 hover:bg-emerald-500 transition"
                  >
                    Nieuwe Kamer Genereren
                  </button>
                )}
                {restoredLoaded && (
                  <button
                    onClick={() => {
                      downloadPhoto(
                        restoredImage!,
                        appendNewToName(photoName!)
                      );
                    }}
                    className="bg-white rounded-full text-black border font-medium px-4 py-2 mt-8 hover:bg-gray-100 transition"
                  >
                    Download Ontwerp
                  </button>
                )}
              </div>

              {/* CTA naar ArchiteQt platform */}
              {restoredLoaded && (
                <div className="mt-10 mb-4 p-6 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 max-w-lg">
                  <p className="text-gray-300 text-sm mb-3">
                    💡 Met ArchiteQt krijg je ook urenregistratie, offertes,
                    rapportages en meer — speciaal voor architecten.
                  </p>
                  <a
                    href="https://architeqt.tech/signup"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block bg-emerald-600 rounded-lg text-white text-sm font-medium px-5 py-2.5 hover:bg-emerald-500 transition"
                  >
                    30 dagen gratis proberen →
                  </a>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ResizablePanel>
      </main>
      <Footer />
    </div>
  );
}
