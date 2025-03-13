import * as React from "react";
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import RichNote from "../richNote";
import { useEffect } from "react";
import {worksListDB} from "@/database/worksLists";
import {noteContentDB} from "@/database/noteContentDB";

export default function BasicTabs({ worksItem,setWorksItem,setWorksList }) {
    // 打开的标签页和内容
    const [tabs, setTabs] = React.useState([]);
    // 当前选中的标签页
    const [value, setValue] = React.useState(''); // Initialize with empty string
    // 当前选中的标签页item
    const [activeTabsItem, setActiveTabsItem] = React.useState({});

    useEffect(() => {
        const fetchAndAddTab = async () => {
            if (!worksItem?.id) return;

            const isExistsSameTabWhthID = tabs.some(item => item.value === String(worksItem.id));
            if (isExistsSameTabWhthID) return setValue(String(worksItem.id));
            const noteContent = await noteContentDB.getContentByNoteId(worksItem.id);

            setTabs(prevTabs => {
                const exists = prevTabs.some(item => item.value === String(worksItem.id));
                if (exists) return prevTabs;

                return [...prevTabs, {
                    label: worksItem.title,
                    value: String(worksItem.id),
                    content: noteContent || ''
                }];
            });

            // 设置当前激活的标签页为新添加的标签页
            setValue(String(worksItem.id)); // 新增代码
        };

        fetchAndAddTab();
    }, [worksItem]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: "100%" }}>
            {/* Render TabContext only when tabs exist */}
                <TabContext value={value}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList
                            onChange={handleChange}
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            {tabs.map((tab) => (
                                <Tab label={tab.label} value={tab.value} key={tab.value} />
                            ))}
                        </TabList>
                    </Box>
                    {tabs.map((tab) => (
                        <TabPanel keepMounted value={tab.value} key={tab.value}>
                            <RichNote activeTabsItem={activeTabsItem} tabItem={tab} setTabs={setTabs} setActiveTabsItem={setActiveTabsItem} setWorksList={setWorksList}></RichNote>
                        </TabPanel>
                    ))}
                </TabContext>
        </Box>
    );
}
