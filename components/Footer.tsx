import Link from "next/link";

export default function Footer() {
  return (
    <footer className="text-center h-16 sm:h-20 w-full sm:pt-2 pt-4 border-t mt-5 flex sm:flex-row flex-col justify-between items-center px-3 space-y-3 sm:mb-0 mb-3 border-gray-700">
      <div className="text-gray-500 text-sm">
        <span className="font-semibold text-emerald-500">Archite</span>
        <span className="font-semibold text-white">Qt</span>
        <span className="text-emerald-400/60 ml-1">Vision</span>
        <span className="mx-2">·</span>
        Onderdeel van{" "}
        <a
          href="https://architeqt.tech"
          target="_blank"
          rel="noreferrer"
          className="font-medium hover:underline transition hover:text-emerald-400 underline-offset-2"
        >
          ArchiteQt.tech
        </a>
      </div>
      <div className="flex items-center space-x-4 pb-4 sm:pb-0 text-sm text-gray-500">
        <a
          href="https://architeqt.tech/prijzen"
          target="_blank"
          rel="noreferrer"
          className="hover:text-emerald-400 transition"
        >
          Plannen & Prijzen
        </a>
        <span className="text-gray-700">|</span>
        <a
          href="mailto:info@architeqt.tech"
          className="hover:text-emerald-400 transition"
        >
          Contact
        </a>
      </div>
    </footer>
  );
}
