import * as React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import RichNote from "../richNote";
import { useEffect } from "react";
import { worksListDB } from "@/database/worksLists";
import { noteContentDB } from "@/database/noteContentDB";
import { preferencesDB } from "@/database/perferencesDB";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { debounce } from "lodash";

// 定义标签页类型
interface TabItem {
  id: string;
  label: string;
  value: string;
  content: string;
}

// 定义组件属性类型
interface BasicTabsProps {
  worksItem: any;
  setWorksItem: (item: any) => void;
  setWorksList: (list: any) => void;
  setCurrentEditor: (editor: any) => void;
  setCurrentTab: (tab: any) => void;
  setActiveRichTextEditor: (editor: any) => void;
}

export default function BasicTabs({
  worksItem,
  setWorksItem,
  setWorksList,
  setCurrentEditor,
  setCurrentTab,
  setActiveRichTextEditor,
}: BasicTabsProps) {
  const [tabs, setTabs] = React.useState<TabItem[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [activeTabsItem, setActiveTabsItem] = React.useState<TabItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(false);

  // 加载保存的标签页
  useEffect(() => {
    const loadSavedTabs = async () => {
      try {
        const preferences = await preferencesDB.getPreferences();
        const savedTabs = preferences.tabsByOpen || [];
        const activeTabId = preferences.activeTab || "";

        if (savedTabs.length > 0) {
          // 加载所有保存的标签页，但不加载内容
          const loadedTabs: TabItem[] = [];
          for (const tabData of savedTabs) {
            loadedTabs.push({
              id: tabData.id,
              label: tabData.label,
              value: tabData.id,
              content: "", // 初始化为空，内容将在需要时加载
            });
          }

          setTabs(loadedTabs);

          // 设置活动标签页
          if (activeTabId) {
            const activeIndex = loadedTabs.findIndex(
              (tab) => tab.value === activeTabId,
            );
            if (activeIndex !== -1) {
              setSelectedIndex(activeIndex);
            }
          }
        }
      } catch (error) {
        console.error("加载保存的标签页失败:", error);
      }
    };

    loadSavedTabs();
  }, []);

  // 当选中标签页变化时，加载内容
  useEffect(() => {
    const loadTabContent = async () => {
      if (
        tabs.length === 0 ||
        selectedIndex < 0 ||
        selectedIndex >= tabs.length
      )
        return;

      const currentTab = tabs[selectedIndex];
      if (!currentTab.id || currentTab.content) return; // 如果已经有内容或没有ID，则不加载

      setIsLoading(true);
      try {
        const noteContent = await noteContentDB.getContentByNoteId(
          currentTab.id,
        );

        // 更新当前标签页的内容
        setTabs((prevTabs) => {
          return prevTabs.map((tab, index) => {
            if (index === selectedIndex) {
              return { ...tab, content: noteContent || "" };
            }
            return tab;
          });
        });
      } catch (error) {
        console.error("加载笔记内容失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTabContent();
  }, [selectedIndex, tabs]);

  // 保存标签页到preferencesDB
  useEffect(() => {
    const saveTabsToPreferences = async () => {
      if (tabs.length === 0) return;

      try {
        // 获取当前偏好设置
        const preferences = await preferencesDB.getPreferences();

        // 准备要保存的标签页数据，只保存ID和标题，不保存内容
        const tabsToSave = tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
        }));

        // 获取当前活动标签页ID
        const activeTabId = tabs[selectedIndex]?.value || "";

        // 更新偏好设置
        await preferencesDB.updatePreferences({
          ...preferences,
          tabsByOpen: tabsToSave,
          activeTab: activeTabId,
        });
      } catch (error) {
        console.error("保存标签页到偏好设置失败:", error);
      }
    };

    // 使用防抖函数来限制保存频率
    const debouncedSave = debounce(saveTabsToPreferences, 1000);
    debouncedSave();

    // 清理防抖函数
    return () => {
      debouncedSave.cancel();
    };
  }, [tabs, selectedIndex]);

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
      // 获取笔记内容
      const noteContent = await noteContentDB.getContentByNoteId(worksItem.id);

      const newTab: TabItem = {
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
  const handleCloseTab = (tabValue: string, e: React.MouseEvent) => {
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
                setWorksList={setWorksList}
                setCurrentEditor={setCurrentEditor}
                setActiveRichTextEditor={setActiveRichTextEditor}
              />
            </TabPanel>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
