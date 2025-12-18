import { createContext, useContext, useState } from "react";

const PageTitleContext = createContext();

export function PageTitleProvider({ children }) {
  const [pageTitle, setPageTitle] = useState({
    title: "",
    icon: null,
  });

  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}

export function usePageTitleLabel(title, icon = null) {
  const { setPageTitle } = usePageTitle();
  setPageTitle({ title, icon });
}
