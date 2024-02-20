import React from "react";
import ChatClient from "./chatClient";
import  {within, userEvent} from '@storybook/testing-library'
export default {
    title: 'components/chatscreen',
    component: ChatClient
}

const Template = (args) => <ChatClient {...args}/>

export const Primary = Template.bind({})
Primary.play = async ({canvasElement}) =>{
    const canvas = within(canvasElement);
    const searchInput = await canvas.getByPlaceholderText('search anything here ...')
    await userEvent.click(searchInput)
    await userEvent.keyboard("Hi")
}
