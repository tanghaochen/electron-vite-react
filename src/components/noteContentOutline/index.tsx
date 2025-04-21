import * as React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import RichNote from "../richNote";
import { useEffect, useState } from "react";
import { worksListDB } from "@/database/worksLists";
import { noteContentDB } from "@/database/noteContentDB";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { preferencesDB } from "@/database/perferencesDB";
import ReactDOM from "react-dom";

export default function BasicTabs({
  worksItem,
  setWorksItem,
  setWorksList,
  setCurrentEditor,
  setCurrentTab,
  setActiveRichTextEditor,
}) {
  // 打开的tab数组
  const [tabs, setTabs] = React.useState([]);
  // 当前选中的tab的index, 从0开始, 显示打开第几个tab
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  // 当前选中的tab
  const [activeTabsItem, setActiveTabsItem] = React.useState({});
  const [isLoading, setIsLoading] = useState(true);

  // 同步当前选中标签
  useEffect(() => {
    if (tabs.length > 0 && selectedIndex >= tabs.length) {
      setSelectedIndex(tabs.length - 1);
    }
    const updateCurrentTab = async () => {
      // 更新当前活动标签
      if (
        tabs.length > 0 &&
        selectedIndex >= 0 &&
        selectedIndex < tabs.length
      ) {
        const currentTab = tabs[selectedIndex];
        setCurrentTab(currentTab);
        setActiveTabsItem(currentTab); // 确保更新活动标签项
        // 记录被选中的tab, 是合并重叠的方式更新{...currentTab}
        // tab去掉content保存
        const noContentTabs = tabs.map((tab) => ({
          ...tab,
          content: "",
        }));
        // console.log("更新当前活动标签", currentTab);
        preferencesDB.updatePreferences({
          openedTabs: noContentTabs,
          selectedTab: currentTab,
          selectedIndex: selectedIndex,
        });
      } else {
        setCurrentTab(null);
        setActiveTabsItem(null);
      }
    };
    updateCurrentTab();
  }, [tabs, selectedIndex, setCurrentTab]);

  // 页面加载时，恢复上次打开的tab
  useEffect(() => {
    let isMounted = true;

    const fetchOpenedTabs = async () => {
      try {
        setIsLoading(true);
        if (!isMounted) return;

        const preferencesRes = await preferencesDB.getPreferences();
        if (!isMounted) return;

        const { openedTabs, selectedIndex, selectedTab } = preferencesRes;
        if (!openedTabs?.length || !isMounted) return;

        const openedTabsData = await Promise.all(
          openedTabs.map(async (tab) => ({
            ...tab,
            content: await noteContentDB.getContentByNoteId(tab.id),
          })),
        );

        if (!isMounted) return;

        ReactDOM.unstable_batchedUpdates(() => {
          setTabs(openedTabsData);
          setActiveTabsItem(selectedTab);
          setCurrentTab(selectedTab);
          setSelectedIndex(selectedIndex);
          setIsLoading(false);
        });
      } catch (error) {
        console.error("Error fetching opened tabs:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOpenedTabs();

    return () => {
      isMounted = false;
    };
  }, []);

  // 点击词条 添加新标签页
  useEffect(() => {
    const fetchAndAddTab = async () => {
      if (!worksItem?.id) return;

      const tabId = String(worksItem.id);
      const existsIndex = tabs.findIndex((t) => t.value === tabId);

      if (existsIndex !== -1) {
        setSelectedIndex(existsIndex);
        return;
      }
      // 获取笔记内容
      const noteContent = await noteContentDB.getContentByNoteId(worksItem.id);

      const newTab = {
        id: tabId,
        label: worksItem.title,
        value: tabId,
        content: noteContent || "",
      };

      setTabs((prev) => [...prev, newTab]);
      // 记录打开的tab, 不记录content
      const openedTabs = tabs?.map((tab) => ({
        id: tab.id,
        label: tab.label,
        value: tab.value,
      }));
      console.log("openedTabs", openedTabs, tabs);
      // 记录打开了哪些tab, 不记录content
      preferencesDB.updatePreferences({
        openedTabs: [...openedTabs, newTab],
      });

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

  useEffect(() => {
    console.log("Tabs changed:", tabs);
  }, [tabs]);

  useEffect(() => {
    console.log("ActiveTabsItem changed:", activeTabsItem);
  }, [activeTabsItem]);

  return (
    <div className="flex-1 relative overflow-hidden">
      {isLoading ? (
        <div>加载中...</div>
      ) : (
        <Tabs
          selectedIndex={selectedIndex}
          onSelect={(index) => setSelectedIndex(index)}
          forceRenderTabPanel
        >
          <TabList>
            {tabs.map((tab) => (
              <Tab key={tab.value}>
                <div className="custom-tab-content">
                  <span>{tab.label || "未命名"}</span>
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
                  setActiveRichTextEditor={setActiveRichTextEditor}
                />
              </TabPanel>
            ))}
          </div>
        </Tabs>
      )}
    </div>
  );
}
