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
import  './styles/index.scss'
import CloseIcon from '@mui/icons-material/Close';
import {IconButton} from "@mui/material";
import {useSortable} from '@dnd-kit/react/sortable';
import {CSS} from "@dnd-kit/utilities";

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
        console.log('newValue', newValue)
        setValue(newValue || false);
    };

    // 处理关闭标签页
    const handleCloseTab = (event, tabValue) => {
        event.stopPropagation(); // 阻止触发 Tab 切换

        setTabs(prev => {
            const newTabs = prev.filter(tab => tab.value !== tabValue);

            // 如果关闭的是当前激活的标签页
            if (value === tabValue) {
                // 自动切换到前一个标签页（如果存在）
                const prevIndex = prev.findIndex(tab => tab.value === tabValue) - 1;
                setValue(prevIndex >= 0 ? prev[prevIndex].value : '');
            }

            return newTabs;
        });
    };

    // 带关闭按钮的标签页渲染
    const renderTabLabel = (tab) => {
        console.log('tab', tab)
        return
            (
                <div className="flex justify-between items-center min-w-28 h-4">
                    <div className='pl-2'>{tab.label}</div>
                    <IconButton
                        size="small"
                        onClick={(e) => handleCloseTab(e, tab.value)}
                        sx={{
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
                            height: '18px',
                            borderRadius: '50%',
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                </div>
            )
    };

    function Sortable({tab, id, index}) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
        } = useSortable({id:tab.id, index});
        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
        };
        return (
            <Tab
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                style={style}
                draggable={true}
                label={renderTabLabel(tab)}
                value={tab.value||false}
                key={tab.value}
                id={tab.value}
                disableTouchRipple={true}
                onMouseDown={(e) => e.stopPropagation()}
                index={tab.value}
                color='inherit'
                sx={{
                    borderRight: '1px solid #E0E0E0',

                    '&.Mui-selected': {
                        backgroundColor: 'white',
                        fontWeight: 600,
                    }
                }}
            />
        );
    }
    return (
        <Box sx={{ width: "100%", height: "2rem" }}>
            {/* Render TabContext only when tabs exist */}
                <TabContext value={value||false}>
                    <Box sx={{ backgroundColor:'#FAFAF9' }}>
                        <TabList
                            onChange={handleChange}
                            variant="scrollable"
                            indicatorColor="none"
                            scrollButtons="auto"
                            sx={{
                                height: '2rem',
                                minHeight: '2rem',
                                '& .MuiTab-root': {
                                    minHeight: '2rem',
                                    padding: '0 8px'
                                }
                            }}
                        >
                            {tabs.map((tab,index) => (
                                <Sortable
                                    index={index}
                                    key={index}
                                    tab={tab}
                                />
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
