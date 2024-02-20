import React from "react";
import Button from "./Button";

export default {
    title: 'form/Button',
    component: Button,
    argTypes: {handleClick: {action: "handleClick"}},
}

const Template = args => <Button {...args}/>

export const Primary = Template.bind({})
Primary.args={
    backgroundColor: 'green',
    label: 'Log out',
    size: "md",
    fontSize: "1rem",
    borderRadius: "1rem"
}