import React, { useState } from "react";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

function EditableAccordion({ items = [], onChange }) {
    const [accordionItems, setAccordionItems] = useState(items);

    const handleChange = (index, newValue) => {
        const updated = [...accordionItems];
        updated[index] = newValue;
        setAccordionItems(updated);
        onChange?.(updated);
    };

    return (
        <Accordion type="multiple" collapsible className="space-y-2">
            {accordionItems.map((item, idx) => (
                <AccordionItem key={idx} value={idx.toString()}>
                    <AccordionTrigger>
                        {item.title || `Item ${idx + 1}`}
                    </AccordionTrigger>
                    <AccordionContent>
                        <textarea
                            value={item.content || ""}
                            onChange={(e) => handleChange(idx, { ...item, content: e.target.value })}
                            className="w-full border rounded p-1"
                            rows={4}
                        />
                        <div className="mt-2 flex justify-end">
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                    const updated = accordionItems.filter((_, i) => i !== idx);
                                    setAccordionItems(updated);
                                    onChange?.(updated);
                                }}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

export default EditableAccordion;
