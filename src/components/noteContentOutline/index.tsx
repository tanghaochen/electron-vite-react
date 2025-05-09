import * as React from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "./styles/index.scss";
import RichNote from "../richNote";
import { useEffect, useState } from "react";
import { worksListDB } from "@/database/worksLists";
import { noteContentDB } from "@/database/noteContentDB";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { preferencesDB } from "@/database/perferencesDB";
import ReactDOM from "react-dom";

interface TabItem {
  id: string;
  label: string;
  value: string;
  content: string;
}

interface BasicTabsProps {
  worksItem: any;
  setWorksItem: (item: any) => void;
  setWorksList: (list: any[]) => void;
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
  const [isLoading, setIsLoading] = useState(true);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<
    "left" | "right" | null
  >(null);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;

    setDragOverIndex(index);
    setDragOverPosition(isLeft ? "left" : "right");
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

    if (dragIndex !== dropIndex) {
      const newTabs = [...tabs];
      const [draggedItem] = newTabs.splice(dragIndex, 1);

      const insertIndex =
        dragOverPosition === "left" ? dropIndex : dropIndex + 1;
      newTabs.splice(insertIndex, 0, draggedItem);

      setTabs(newTabs);
    }

    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <Tabs
        selectedIndex={selectedIndex}
        onSelect={(index) => setSelectedIndex(index)}
        forceRenderTabPanel
      >
        <TabList className="flex flex-wrap m-0 p-0 bg-gray-100">
          {tabs.map((tab, index) => (
            <Tab key={tab.value}>
              {dragOverIndex === index && (
                <div
                  className={`absolute top-0 h-full w-1 bg-blue-500 z-10 ${
                    dragOverPosition === "left" ? "left-[-1px]" : "right-[-1px]"
                  }`}
                />
              )}
              <div className="relative flex">
                <div
                  className="custom-tab-content group"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <span>{tab.label || "未命名"}</span>
                  {/* 关闭按钮: 默认隐藏，hover或active时显示 */}
                  <IconButton
                    size="small"
                    className={`custom-close-button ${
                      selectedIndex === index ? "visible" : "invisible"
                    } group-hover:visible`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.value, e);
                    }}
                    sx={{
                      p: 0,
                      ml: 1,
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.08)" },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
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
    </div>
  );
}
