declare module 'react-native-html-to-pdf' {
  export interface Options {
    html: string;
    fileName?: string;
    directory?: string;
    base64?: boolean;
    height?: number;
    width?: number;
    padding?: number;
    bgColor?: string;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
  }

  export interface PDF {
    filePath?: string;
    base64?: string;
  }

  const RNHTMLtoPDF: {
    convert(options: Options): Promise<PDF>;
  };
  
  export default RNHTMLtoPDF;
}