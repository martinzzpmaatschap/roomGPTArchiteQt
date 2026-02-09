import Link from "next/link";

export default function Header() {
  return (
    <header className="flex flex-col xs:flex-row justify-between items-center w-full mt-3 border-b pb-4 sm:px-4 px-2 border-gray-700 gap-2">
      <Link href="/" className="flex space-x-1 items-center">
        <span className="text-2xl font-bold">
          <span className="text-emerald-500">Archite</span>
          <span className="text-white">Qt</span>
          <span className="text-emerald-400/60 font-normal text-lg ml-2">Vision</span>
        </span>
      </Link>
      <div className="flex items-center space-x-4">
        <a
          href="https://architeqt.tech/pricing"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-gray-400 hover:text-emerald-400 transition"
        >
          Bekijk plannen
        </a>
        <a
          href="https://architeqt.tech/signup"
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-600 rounded-lg text-white text-sm font-medium px-4 py-2 hover:bg-emerald-500 transition"
        >
          Gratis proberen
        </a>
      </div>
    </header>
  );
}
