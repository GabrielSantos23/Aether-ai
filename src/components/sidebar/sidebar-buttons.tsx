import { Plus, Search, SettingsIcon } from "lucide-react";
import { Button } from "../ui/button";
import { SidebarTrigger, useSidebar, useSidebarWithSide } from "../ui/sidebar";
import ThemeToggler from "@/components/theme/toggler";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import React from "react";
import { NavLink } from "react-router-dom";

export const CommandDialogContext = React.createContext<{
  setOpen: (open: boolean) => void;
}>({
  setOpen: () => {},
});

export const useCommandDialog = () => {
  return React.useContext(CommandDialogContext);
};

export function SidebarButtons() {
  const { open, isMobile, openMobile } = useSidebar();
  const { setOpen: setCommandOpen } = useCommandDialog();
  const isSidebarClosed = isMobile ? !openMobile : !open;

  const containerVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: {
      width: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        staggerChildren: 0.1,
      },
    },
    exit: {
      width: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      x: -10,
      opacity: 0,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div
      className={`fixed top-[1.40rem] left-5 z-50 flex items-center h-9 ${
        isSidebarClosed ? "bg-card rounded-md border" : ""
      }`}
    >
      <SidebarTrigger className="h-9 w-9" />
      <AnimatePresence>
        {isSidebarClosed && (
          <motion.div
            className="flex gap-1 overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div variants={itemVariants}>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCommandOpen(true)}
              >
                <Search />
              </Button>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCommandOpen(true)}
              >
                <Plus />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SidebarButtonsRight() {
  const { open, isMobile, openMobile } = useSidebar();
  const rightSidebar = useSidebarWithSide("right");
  const isSidebarClosed = isMobile ? !openMobile : !open;
  const isRightSidebarOpen = rightSidebar.open;

  const buttonVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <div className="fixed top-[1.40rem] right-5 z-20">
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {!isRightSidebarOpen ? (
            <motion.div
              key="normal-buttons"
              className="relative flex items-center justify-end"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layoutId="right-sidebar-buttons"
            >
              <motion.div
                className={`flex items-center relative z-10 gap-2 w-full h-full px-2 bg-card rounded-md border`}
                layoutId="button-container"
              >
                <motion.div layoutId="theme-toggler">
                  <ThemeToggler />
                </motion.div>
                <motion.div layoutId="settings-icon">
                  <NavLink to="/settings">
                    <SettingsIcon className="w-5 h-5" />
                  </NavLink>
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="sidebar-trigger"
              className="relative flex items-center justify-end"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layoutId="right-sidebar-buttons"
            >
              <motion.div
                className={`flex items-center relative z-10 gap-2 w-full h-full px-2 bg-card rounded-md border`}
                layoutId="button-container"
              >
                <motion.div layoutId="sidebar-trigger">
                  <SidebarTrigger side="right" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
