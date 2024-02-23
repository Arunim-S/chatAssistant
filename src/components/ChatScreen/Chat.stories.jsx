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
export const Second = Template.bind({})
Second.play = async ({canvasElement}) =>{
    const canvas = within(canvasElement);
    const searchInput = await canvas.getByPlaceholderText('search anything here ...')
    await userEvent.click(searchInput)
    await userEvent.keyboard("Who is the ceo of microsoft")
    const btn = await canvas.getAllByAltText('button submit')
    await userEvent.click(btn)
}
export const Third = Template.bind({})
Third.play = async ({canvasElement}) =>{
    const canvas = within(canvasElement);
    const searchInput = await canvas.getByPlaceholderText('search anything here ...')
    await userEvent.click(searchInput)
    await userEvent.keyboard("Hi")
}
export const Fourth = Template.bind({})
Fourth.play = async ({canvasElement}) =>{
    const canvas = within(canvasElement);
    const searchInput = await canvas.getByPlaceholderText('search anything here ...')
    await userEvent.click(searchInput)
    await userEvent.keyboard("Hi")
}
