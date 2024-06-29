import { FileIcon } from "lucide-react";
import Image from "next/image";
import React from "react";

type Props = {
  apiEndpoint: "agencyLogo" | "avatar" | "subaccountLogo";
  onChange: (url?: string) => void;
  value: string;
};

const FileUpload = ({ apiEndpoint, onChange, value }: Props) => {
  const type = value?.split(".").pop();
  if (value)
    return (
      <div className="flex flex-col justify-center items-center">
        {type !== "pdf" ? (
          <div className="relative w-40 h-40">
            <Image src={value} alt="uploaded image" />
          </div>
        ) : (
          <div className="relative flex items-center p-2 m-2 rounded-md bg-background/10">
            <FileIcon />
            <a
              href={value}
              target="_blank/"
              rel="nooperner_noreferer"
              className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
            />
          </div>
        )}
      </div>
    );
};

export default FileUpload;
