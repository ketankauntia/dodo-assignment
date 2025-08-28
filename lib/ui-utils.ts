export const buttonStyles = {
  // Primary button (blue)
  primary: "bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-colors",
  
  // Secondary button (gray)
  secondary: "bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer transition-colors",
  
  // Danger button (red)
  danger: "bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer transition-colors",
  
  // Success button (green)
  success: "bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer transition-colors",
  
  // Large primary button
  primaryLarge: "bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-colors",
} as const;


export const linkStyles = {
  // Navbar link
  navbar: "text-gray-300 hover:text-white hover:underline px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
  
  // Mobile navbar link
  navbarMobile: "text-gray-300 hover:text-white hover:bg-gray-800 block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer",
  
  // Brand/logo link
  brand: "text-white text-xl font-bold hover:text-gray-300 transition-colors cursor-pointer",
} as const;


export const getButtonClass = (
  style: keyof typeof buttonStyles, 
  disabled: boolean = false,
  fullWidth: boolean = false
): string => {
  let classes: string = buttonStyles[style];
  
  if (disabled) {
    classes += " disabled:opacity-50 disabled:cursor-not-allowed";
  }
  
  if (fullWidth) {
    classes = classes.replace("py-2 px-4", "w-full py-2 px-4");
  }
  
  return classes;
};


export const cardStyles = {
  base: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
  gradient: "bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white",
  success: "bg-green-50 border border-green-200 rounded-lg p-6",
} as const;
