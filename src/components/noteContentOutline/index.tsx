import * as React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import RichNote from "../richNote";
import { useEffect } from "react";
import { worksListDB } from "@/database/worksLists";
import { noteContentDB } from "@/database/noteContentDB";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function BasicTabs({
  worksItem,
  setWorksItem,
  setWorksList,
  setCurrentEditor,
  setCurrentTab,
}) {
  const [tabs, setTabs] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [activeTabsItem, setActiveTabsItem] = React.useState({});

  // 同步当前选中标签
  useEffect(() => {
    if (tabs.length > 0 && selectedIndex >= tabs.length) {
      setSelectedIndex(tabs.length - 1);
    }

    // 更新当前活动标签
    if (tabs.length > 0 && selectedIndex >= 0 && selectedIndex < tabs.length) {
      const currentTab = tabs[selectedIndex];
      setCurrentTab(currentTab);
      setActiveTabsItem(currentTab); // 确保更新活动标签项
    } else {
      setCurrentTab(null);
      setActiveTabsItem(null);
    }
  }, [tabs, selectedIndex, setCurrentTab]);

  // 添加新标签页
  useEffect(() => {
    const fetchAndAddTab = async () => {
      if (!worksItem?.id) return;

      const tabId = String(worksItem.id);
      const existsIndex = tabs.findIndex((t) => t.value === tabId);

      if (existsIndex !== -1) {
        setSelectedIndex(existsIndex);
        return;
      }

      const noteContent = await noteContentDB.getContentByNoteId(worksItem.id);

      const newTab = {
        id: tabId,
        label: worksItem.title,
        value: tabId,
        content: noteContent || "",
      };

      setTabs((prev) => [...prev, newTab]);
      setSelectedIndex(tabs.length); // 切换到新标签
    };

    fetchAndAddTab();
  }, [worksItem]);

  // 关闭标签页
  const handleCloseTab = (tabValue, e) => {
    e.stopPropagation();
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.value !== tabValue);
      return newTabs;
    });
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <Tabs
        selectedIndex={selectedIndex}
        onSelect={(index) => setSelectedIndex(index)}
        forceRenderTabPanel
      >
        <TabList>
          {tabs.map((tab) => (
            <Tab key={tab.value}>
              <div className="custom-tab-content">
                <span>{tab.label}</span>
                <IconButton
                  size="small"
                  onClick={(e) => handleCloseTab(tab.value, e)}
                  sx={{
                    p: 0,
                    ml: 1,
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            </Tab>
          ))}
        </TabList>

        <div className={"w-auto"}>
          {tabs.map((tab) => (
            <TabPanel key={tab.value}>
              <RichNote
                activeTabsItem={activeTabsItem}
                tabItem={tab}
                setTabs={setTabs}
                setActiveTabsItem={setActiveTabsItem}
                setWorksList={setWorksList}
                setCurrentEditor={setCurrentEditor}
              />
            </TabPanel>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
